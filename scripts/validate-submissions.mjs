import { catalogArguments, validateRepository } from "./repository.mjs";

const catalogPaths = catalogArguments();
const { submissions, failures } = await validateRepository({ catalogPaths });

if (failures.length) {
  console.error(`Validation failed with ${failures.length} problem${failures.length === 1 ? "" : "s"}:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${submissions.length} public evaluation submission${submissions.length === 1 ? "" : "s"}${catalogPaths.length ? " against the official suite catalogs" : ""}.`);
}
