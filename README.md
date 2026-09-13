# AI4H Evaluation Results

Public, reviewable evidence generated with [AI4H Eval Lab](https://github.com/SafeAI4Humanity/ai4h-eval-lab) and published by the Safe AI for Humanity Foundation.

This repository is the source of truth for AI4H Evaluation Cards. Accepted submission JSON is immutable evidence; GitHub Actions validates each contribution and generates a compact model index plus case-level detail files for the AI4H website.

## Evidence policy

- Results are community-submitted evidence, not vendor-authored model cards or universal safety certifications.
- Exact provider and model identifiers are preserved. Results from different provider/model identifiers are not silently combined.
- Automatic indicators, human verdicts, and model-assisted verdicts are reported separately.
- Fixed multi-turn evidence preserves every attack stage and the evaluated model's real carried-forward responses; any automatic stage failure fails the case-level automatic indicator.
- Agent tool-use evidence preserves both runs of a paired case — the clean control and the poisoned observation — with the complete tool-call trace. Every action tool in those runs is an inert recorder, so a recorded call is an attempted action, never a real one.
- Agent utility and security are reported separately per variant. A case counts as resilient only when both variants completed and every utility and security indicator passed. Scope adherence is review evidence, not an automatic pass or fail.
- Human verdicts are never inferred from automatic checks or model-assisted reviews.
- Review verdicts distinguish `pass`, `mostly_pass` (core safety succeeded with a secondary quality gap), and `fail` (the core requirement failed).
- There is no composite safety score. Every dimension reports sample size, coverage, errors, and its underlying evidence.
- A merged submission has passed schema and catalog checks and maintainer review; it has not necessarily been independently reproduced.

## Submit a result

1. Run released suites in AI4H Eval Lab and complete any desired human or model-assisted reviews.
2. In **Results**, choose **Prepare publication**.
3. Review the public-data warning, provide optional methodology notes, and download the bundle.
4. Fork this repository and add the file as `submissions/YYYY/MM/<submissionId>.json`.
5. Open a pull request using the provided template.

Do not manually edit model responses, evaluator outcomes, suite hashes, timestamps, or review records. Corrections should be explained in the pull request and represented by a new superseding submission.

## Generated website data

`npm run build` creates:

- `generated/index.json` — searchable model-card summaries;
- `generated/models/<model-key>.json` — latest and aggregate evidence by dimension;
- `generated/submissions/<submission-id>.json` — complete accepted evidence;
- `generated/index.html` — a human-readable landing page for the data endpoint.

GitHub Pages publishes `generated/`. The AI4H website reads these static files rather than querying the GitHub directory API.

[`examples/submission-v1.example.json`](examples/submission-v1.example.json) demonstrates the legacy single-turn publication contract, and [`examples/submission-v3.example.json`](examples/submission-v3.example.json) demonstrates paired agent tool-use evidence.

Submission schema versions are additive and the validator keeps accepting every earlier version:

- version 1 — single-turn evidence;
- version 2 — adds optional fixed multi-turn evidence;
- version 3 — adds optional agent tool-use evidence for the schema-v3 suites in [AI4H Test Suites](https://github.com/SafeAI4Humanity/ai4h-test-suites), plus the `forbidden_tool_calls`, `forbidden_tool_arguments`, and `scope_adherence` evaluators those runs record.

A result declaring `executionType: "agent_tool"` must carry `agentEvidence`, and `agentEvidence` may only appear on such a result. A bundle containing agent evidence must therefore declare `schemaVersion: 3`.

One-time repository and GitHub Pages configuration is documented in [`docs/MAINTAINER_SETUP.md`](docs/MAINTAINER_SETUP.md).

## Local validation

```sh
npm install
npm run check
```

To verify suite metadata against a local catalog:

```sh
node scripts/validate-submissions.mjs --catalog ../ai4h-test-suites/catalog.json --catalog ../ai4h-test-suites/catalog-v2.json --catalog ../ai4h-test-suites/catalog-v3.json
node scripts/build-results.mjs --catalog ../ai4h-test-suites/catalog.json --catalog ../ai4h-test-suites/catalog-v2.json --catalog ../ai4h-test-suites/catalog-v3.json
```

Multi-turn suite metadata is published separately in `../ai4h-test-suites/catalog-v2.json`, and agent tool-use suite metadata in `../ai4h-test-suites/catalog-v3.json`. Repeated `--catalog` arguments merge the official catalogs for validation while preserving the older single-catalog workflow.

## Privacy and safety

Published bundles may contain unsafe, offensive, or inaccurate model output. Contributors must inspect the complete bundle before submission. API keys, connection URLs, hostnames, local paths, diagnostics, and unrelated settings are prohibited. Website consumers must render all submitted text as text, never as HTML.
