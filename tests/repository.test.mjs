import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { catalogArguments, validateRepository } from "../scripts/repository.mjs";

test("collects repeated official catalog arguments", () => {
  assert.deepEqual(catalogArguments(["--catalog", "catalog.json", "--catalog", "catalog-v2.json"]), ["catalog.json", "catalog-v2.json"]);
});

test("validates a correctly placed exported submission", async () => {
  const root = await mkdtemp(join(tmpdir(), "ai4h-results-test-"));
  try {
    await mkdir(join(root, "schema"), { recursive: true });
    await mkdir(join(root, "submissions", "2026", "07"), { recursive: true });
    await copyFile(new URL("../schema/submission-v1.schema.json", import.meta.url), join(root, "schema", "submission-v1.schema.json"));
    await copyFile(new URL("../schema/submission-v2.schema.json", import.meta.url), join(root, "schema", "submission-v2.schema.json"));
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
