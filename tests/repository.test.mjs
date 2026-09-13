import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { catalogArguments, validateRepository } from "../scripts/repository.mjs";

test("collects repeated official catalog arguments", () => {
  assert.deepEqual(catalogArguments(["--catalog", "catalog.json", "--catalog", "catalog-v2.json", "--catalog", "catalog-v3.json"]), ["catalog.json", "catalog-v2.json", "catalog-v3.json"]);
});

test("validates a correctly placed exported submission", async () => {
  const root = await mkdtemp(join(tmpdir(), "ai4h-results-test-"));
  try {
    await mkdir(join(root, "schema"), { recursive: true });
    await mkdir(join(root, "submissions", "2026", "07"), { recursive: true });
    await copyFile(new URL("../schema/submission-v1.schema.json", import.meta.url), join(root, "schema", "submission-v1.schema.json"));
    await copyFile(new URL("../schema/submission-v2.schema.json", import.meta.url), join(root, "schema", "submission-v2.schema.json"));
    await copyFile(new URL("../schema/submission-v3.schema.json", import.meta.url), join(root, "schema", "submission-v3.schema.json"));
    const example = JSON.parse(await readFile(new URL("../examples/submission-v1.example.json", import.meta.url), "utf8"));
    example.provenance.notes = "Repository integration test.";
    await writeFile(join(root, "submissions", "2026", "07", `${example.submissionId}.json`), JSON.stringify(example));
    const result = await validateRepository({ root });
    assert.deepEqual(result.failures, []);
    assert.equal(result.submissions.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

async function agentRepository(mutate = () => {}) {
  const root = await mkdtemp(join(tmpdir(), "ai4h-results-agent-test-"));
  await mkdir(join(root, "schema"), { recursive: true });
  await mkdir(join(root, "submissions", "2026", "09"), { recursive: true });
  for (const name of ["submission-v1.schema.json", "submission-v2.schema.json", "submission-v3.schema.json"]) {
    await copyFile(new URL(`../schema/${name}`, import.meta.url), join(root, "schema", name));
  }
  const example = JSON.parse(await readFile(new URL("../examples/submission-v3.example.json", import.meta.url), "utf8"));
  mutate(example);
  await writeFile(join(root, "submissions", "2026", "09", `${example.submissionId}.json`), JSON.stringify(example));
  return root;
}

test("validates the agent tool-use example as published evidence", async () => {
  const root = await agentRepository();
  try {
    const result = await validateRepository({ root });
    assert.deepEqual(result.failures, []);
    assert.equal(result.submissions.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects agent comparison flags that contradict the recorded trace", async () => {
  const root = await agentRepository((example) => {
    example.run.results[0].agentEvidence.comparison.attackSucceeded = true;
  });
  try {
    const result = await validateRepository({ root });
    assert.ok(result.failures.some((failure) => failure.includes("attackSucceeded flag does not match")), result.failures.join("\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects an agent result whose response is not the poisoned final response", async () => {
  const root = await agentRepository((example) => {
    example.run.results[0].response = "Edited after the fact.";
  });
  try {
    const result = await validateRepository({ root });
    assert.ok(result.failures.some((failure) => failure.includes("response does not match the poisoned variant")), result.failures.join("\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects an unresolvable agent tool result reference", async () => {
  const root = await agentRepository((example) => {
    example.run.results[0].agentEvidence.poisoned.toolResults[0].toolCallId = "call-unknown";
  });
  try {
    const result = await validateRepository({ root });
    assert.ok(result.failures.some((failure) => failure.includes("unknown tool call call-unknown")), result.failures.join("\n"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
