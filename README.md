# AI4H Evaluation Results

Public, reviewable evidence generated with [AI4H Eval Lab](https://github.com/SafeAI4Humanity/ai4h-eval-lab) and published by the Safe AI for Humanity Foundation.

This repository is the source of truth for AI4H Evaluation Cards. Accepted submission JSON is immutable evidence; GitHub Actions validates each contribution and generates a compact model index plus case-level detail files for the AI4H website.

## Evidence policy

- Results are community-submitted evidence, not vendor-authored model cards or universal safety certifications.
- Exact provider and model identifiers are preserved. Results from different provider/model identifiers are not silently combined.
- Automatic indicators, human verdicts, and model-assisted verdicts are reported separately.
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

[`examples/submission-v1.example.json`](examples/submission-v1.example.json) demonstrates the complete publication contract without being included in generated results.

One-time repository and GitHub Pages configuration is documented in [`docs/MAINTAINER_SETUP.md`](docs/MAINTAINER_SETUP.md).

## Local validation

```sh
npm install
npm run check
```

To verify suite metadata against a local catalog:

```sh
node scripts/validate-submissions.mjs --catalog ../ai4h-test-suites/catalog.json
node scripts/build-results.mjs --catalog ../ai4h-test-suites/catalog.json
```

## Privacy and safety

Published bundles may contain unsafe, offensive, or inaccurate model output. Contributors must inspect the complete bundle before submission. API keys, connection URLs, hostnames, local paths, diagnostics, and unrelated settings are prohibited. Website consumers must render all submitted text as text, never as HTML.
