import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, join, relative, resolve, sep } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

export const repositoryRoot = resolve(import.meta.dirname, "..");

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

export function hashJson(value) {
  return `sha256:${createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex")}`;
}

async function jsonFiles(directory) {
  const files = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return files;
    throw error;
  }
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await jsonFiles(path));
    if (entry.isFile() && entry.name.endsWith(".json")) files.push(path);
  }
  return files;
}

export async function createSubmissionValidator(root = repositoryRoot) {
  const schema = JSON.parse(await readFile(join(root, "schema", "submission-v1.schema.json"), "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

export async function validateSubmissionObject(submission, root = repositoryRoot) {
  const validate = await createSubmissionValidator(root);
  const valid = validate(submission);
  return {
    valid,
    errors: valid ? [] : (validate.errors ?? []).map((error) => `${error.instancePath || "/"} ${error.message}`)
  };
}

function catalogMap(catalog) {
  return new Map((catalog?.suites ?? []).map((suite) => [`${suite.id}@${suite.version}`, suite]));
}

function prohibitedMetadata(submission) {
  const metadata = JSON.stringify({
    provenance: submission.provenance,
    runName: submission.run.name,
    targets: submission.run.targets
  });
  const patterns = [
    { pattern: /https?:\/\/(?:localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01]))/i, message: "local or private network URL" },
    { pattern: /(?:\/Users\/|\/home\/|[A-Z]:\\Users\\)/i, message: "local filesystem path" },
    { pattern: /\b[a-z0-9-]+\.local(?::\d+)?\b/i, message: "local hostname" },
    { pattern: /\bsk-[A-Za-z0-9_-]{12,}\b/, message: "possible API key" },
    { pattern: /\bAIza[0-9A-Za-z_-]{20,}\b/, message: "possible API key" }
  ];
  return patterns.filter(({ pattern }) => pattern.test(metadata)).map(({ message }) => message);
}

function semanticErrors(submission, catalog) {
  const errors = [];
  const snapshots = new Map(submission.run.suiteSnapshots.map((suite) => [`${suite.id}@${suite.version}`, suite]));
  const targets = new Set(submission.run.targets.map((target) => `${target.provider}\u0000${target.model}`));
  const official = catalogMap(catalog);

  for (const snapshot of submission.run.suiteSnapshots) {
    const key = `${snapshot.id}@${snapshot.version}`;
    const suite = official.get(key);
    if (catalog && !suite) errors.push(`suite ${key} is not present in the official catalog`);
    if (suite && suite.contentHash !== snapshot.contentHash) errors.push(`suite ${key} content hash does not match the official catalog`);
    if (suite && suite.category !== snapshot.category) errors.push(`suite ${key} category does not match the official catalog`);
    if (suite && suite.risk !== snapshot.risk) errors.push(`suite ${key} risk does not match the official catalog`);
  }

  for (const result of submission.run.results) {
    const suiteKey = `${result.suiteId}@${result.suiteVersion}`;
    const snapshot = snapshots.get(suiteKey);
    if (!snapshot) errors.push(`result ${result.id} references missing suite snapshot ${suiteKey}`);
    if (snapshot && snapshot.contentHash !== result.suiteHash) errors.push(`result ${result.id} does not match suite snapshot ${suiteKey}`);
    if (!targets.has(`${result.target.provider}\u0000${result.target.model}`)) errors.push(`result ${result.id} references a model absent from run.targets`);
    if (new Date(result.completedAt) < new Date(result.startedAt)) errors.push(`result ${result.id} completes before it starts`);
  }

  if (new Date(submission.run.completedAt) < new Date(submission.run.createdAt)) errors.push("run completes before it starts");
  for (const item of prohibitedMetadata(submission)) errors.push(`submission metadata contains a prohibited ${item}`);
  return errors;
}

export async function validateRepository({ root = repositoryRoot, catalogPath } = {}) {
  const validate = await createSubmissionValidator(root);
  const catalog = catalogPath ? JSON.parse(await readFile(resolve(catalogPath), "utf8")) : null;
  const files = await jsonFiles(join(root, "submissions"));
  const submissions = [];
  const failures = [];
  const ids = new Map();
  const evidenceHashes = new Map();

  for (const file of files) {
    let submission;
    try {
      submission = JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      failures.push(`${relative(root, file)}: invalid JSON (${error.message})`);
      continue;
    }

    if (!validate(submission)) {
      for (const error of validate.errors ?? []) failures.push(`${relative(root, file)}${error.instancePath || "/"}: ${error.message}`);
      continue;
    }

    const normalizedPath = relative(root, file).split(sep).join("/");
    const expectedPath = `submissions/${submission.submittedAt.slice(0, 4)}/${submission.submittedAt.slice(5, 7)}/${submission.submissionId}.json`;
    if (normalizedPath !== expectedPath) failures.push(`${normalizedPath}: expected path ${expectedPath}`);
    if (basename(file) !== `${submission.submissionId}.json`) failures.push(`${normalizedPath}: filename must equal the submission ID`);

    const priorId = ids.get(submission.submissionId);
    if (priorId) failures.push(`${normalizedPath}: duplicate submissionId also used by ${priorId}`);
    ids.set(submission.submissionId, normalizedPath);

    const sourceHash = hashJson(submission);
    const evidenceHash = hashJson(submission.run);
    const priorEvidence = evidenceHashes.get(evidenceHash);
    if (priorEvidence) failures.push(`${normalizedPath}: duplicate run evidence also submitted by ${priorEvidence}`);
    evidenceHashes.set(evidenceHash, normalizedPath);

    for (const error of semanticErrors(submission, catalog)) failures.push(`${normalizedPath}: ${error}`);
    submissions.push({ file, path: normalizedPath, submission, sourceHash, evidenceHash });
  }

  return { submissions, failures, catalog };
}

export function catalogArgument(args = process.argv.slice(2)) {
  const index = args.indexOf("--catalog");
  if (index < 0) return undefined;
  if (!args[index + 1]) throw new Error("--catalog requires a file path");
  return args[index + 1];
}
