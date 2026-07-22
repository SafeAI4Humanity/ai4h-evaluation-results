import assert from "node:assert/strict";
import test from "node:test";
import { headlineTotals, modelKey, summarizeResults } from "../scripts/metrics.mjs";

const snapshots = [
  { id: "suite.one", version: "1.0.0", category: "Jailbreak resistance" },
  { id: "suite.two", version: "1.0.0", category: "Privacy and data protection" }
];

const base = {
  suiteId: "suite.one",
  suiteVersion: "1.0.0",
  status: "review",
  outcomes: [
    { evaluator: { type: "contains_none", values: ["CANARY"] }, status: "pass", explanation: "Safe" },
    { evaluator: { type: "human_review", rubric: "Review the complete behavior." }, status: "review", explanation: "Review" }
  ]
};

test("summarizes automatic, human, and model-assisted evidence separately", () => {
  const dimensions = summarizeResults([
    {
      ...base,
      id: "one",
      reviews: [
        { reviewerType: "human", verdict: "fail", reviewedAt: "2026-07-20T00:00:00Z" },
        { reviewerType: "human", verdict: "pass", reviewedAt: "2026-07-21T00:00:00Z" },
        { reviewerType: "model", verdict: "fail", reviewedAt: "2026-07-21T00:01:00Z" }
      ]
    },
    {
      ...base,
      id: "two",
      outcomes: [{ evaluator: { type: "contains_any", values: ["refuse"] }, status: "fail", explanation: "Missing" }],
      reviews: [{ reviewerType: "model", verdict: "pass", reviewedAt: "2026-07-21T00:02:00Z" }]
    },
    {
      ...base,
      id: "three",
      suiteId: "suite.two",
      status: "error",
      outcomes: []
    }
  ], snapshots);

  const jailbreak = dimensions.find((dimension) => dimension.category === "Jailbreak resistance");
  assert.deepEqual(jailbreak.automatic, { eligible: 2, pass: 1, fail: 1, passRate: 50 });
  assert.deepEqual(jailbreak.human, { reviewed: 1, pass: 1, fail: 0, coverage: 50, passRate: 100 });
  assert.deepEqual(jailbreak.modelAssisted, { reviewed: 2, pass: 1, fail: 1, coverage: 100, passRate: 50 });
  assert.equal(dimensions.find((dimension) => dimension.category === "Privacy and data protection").errors, 1);

  const totals = headlineTotals(dimensions);
  assert.equal(totals.cases, 3);
  assert.equal(totals.humanReviewed, 1);
  assert.equal(totals.humanCoverage, 33.3);
});

test("model keys are stable and provider-qualified", () => {
  assert.equal(modelKey("ollama", "llama3.2:latest"), modelKey("ollama", "llama3.2:latest"));
  assert.notEqual(modelKey("ollama", "shared-model"), modelKey("openrouter", "shared-model"));
  assert.match(modelKey("openrouter", "Vendor/Model Name"), /^openrouter-vendor-model-name-[a-f0-9]{10}$/);
});
