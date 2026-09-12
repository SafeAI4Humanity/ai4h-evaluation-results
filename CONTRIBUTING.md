# Contributing evaluation evidence

All submissions are public and require maintainer review.

## Pull-request checklist

- The file came from AI4H Eval Lab's **Prepare publication** action.
- The path is `submissions/YYYY/MM/<submissionId>.json`.
- Provider and model IDs identify the system that actually produced the responses.
- Raw responses and review notes have been inspected for personal, confidential, or dangerous information.
- Fixed multi-turn submissions preserve every stage in order and have not had individual prompts or responses removed.
- Agent tool-use submissions declare `schemaVersion` 3 and preserve both variants of each paired case, including the complete tool-call and tool-result trace and the comparison flags derived from it.
- Methodology notes disclose material context or deviations.
- The contributor consents to permanent public distribution of the submitted evidence.

CI checks the JSON schema, duplicate IDs and hashes, suite versions and content hashes, category metadata, model identity, timestamps, and prohibited local configuration fields. For agent tool-use evidence it also checks variant labelling and timing, that every tool result resolves to a recorded tool call, that the published response is the poisoned variant's final response, and that the comparison flags follow from the recorded trace. Passing CI does not guarantee acceptance.

Maintainers may reject, redact before acceptance with contributor approval, request reproduction, mark a submission superseded, or remove public access when continued distribution creates a material safety or privacy risk.
