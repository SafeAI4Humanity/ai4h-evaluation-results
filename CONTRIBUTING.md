# Contributing evaluation evidence

All submissions are public and require maintainer review.

## Pull-request checklist

- The file came from AI4H Eval Lab's **Prepare publication** action.
- The path is `submissions/YYYY/MM/<submissionId>.json`.
- Provider and model IDs identify the system that actually produced the responses.
- Raw responses and review notes have been inspected for personal, confidential, or dangerous information.
- Fixed multi-turn submissions preserve every stage in order and have not had individual prompts or responses removed.
- Methodology notes disclose material context or deviations.
- The contributor consents to permanent public distribution of the submitted evidence.

CI checks the JSON schema, duplicate IDs and hashes, suite versions and content hashes, category metadata, model identity, timestamps, and prohibited local configuration fields. Passing CI does not guarantee acceptance.

Maintainers may reject, redact before acceptance with contributor approval, request reproduction, mark a submission superseded, or remove public access when continued distribution creates a material safety or privacy risk.
