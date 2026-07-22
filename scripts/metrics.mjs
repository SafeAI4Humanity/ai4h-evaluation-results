import { createHash } from "node:crypto";

export function modelKey(provider, model) {
  const readable = `${provider}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "model";
  const suffix = createHash("sha256").update(`${provider}\u0000${model}`).digest("hex").slice(0, 10);
  return `${readable}-${suffix}`;
}

function latestReview(result, reviewerType) {
  return [...(result.reviews ?? [])]
    .filter((review) => review.reviewerType === reviewerType)
    .sort((left, right) => right.reviewedAt.localeCompare(left.reviewedAt))[0];
}

function percent(numerator, denominator) {
  return denominator ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

function emptyDimension(category) {
  return {
    category,
    cases: 0,
    errors: 0,
    automatic: { eligible: 0, pass: 0, fail: 0, passRate: null },
    human: { reviewed: 0, pass: 0, mostlyPass: 0, fail: 0, coverage: 0, passRate: null },
    modelAssisted: { reviewed: 0, pass: 0, mostlyPass: 0, fail: 0, coverage: 0, passRate: null }
  };
}

export function summarizeResults(results, suiteSnapshots) {
  const categories = new Map(suiteSnapshots.map((suite) => [`${suite.id}@${suite.version}`, suite.category]));
  const dimensions = new Map();

  for (const result of results) {
    const category = categories.get(`${result.suiteId}@${result.suiteVersion}`) ?? "Uncategorized";
    const dimension = dimensions.get(category) ?? emptyDimension(category);
    dimension.cases += 1;
    if (result.status === "error") dimension.errors += 1;

    const automatic = result.outcomes.filter((outcome) => outcome.evaluator.type !== "human_review");
    if (result.status !== "error" && automatic.length) {
      dimension.automatic.eligible += 1;
      if (automatic.every((outcome) => outcome.status === "pass")) dimension.automatic.pass += 1;
      else dimension.automatic.fail += 1;
    }

    const human = latestReview(result, "human");
    if (human) {
      dimension.human.reviewed += 1;
      if (human.verdict === "mostly_pass") dimension.human.mostlyPass += 1;
      else dimension.human[human.verdict] += 1;
    }

    const model = latestReview(result, "model");
    if (model) {
      dimension.modelAssisted.reviewed += 1;
      if (model.verdict === "mostly_pass") dimension.modelAssisted.mostlyPass += 1;
      else dimension.modelAssisted[model.verdict] += 1;
    }
    dimensions.set(category, dimension);
  }

  return [...dimensions.values()].sort((left, right) => left.category.localeCompare(right.category)).map((dimension) => ({
    ...dimension,
    automatic: { ...dimension.automatic, passRate: percent(dimension.automatic.pass, dimension.automatic.eligible) },
    human: {
      ...dimension.human,
      coverage: percent(dimension.human.reviewed, dimension.cases),
      passRate: percent(dimension.human.pass, dimension.human.reviewed)
    },
    modelAssisted: {
      ...dimension.modelAssisted,
      coverage: percent(dimension.modelAssisted.reviewed, dimension.cases),
      passRate: percent(dimension.modelAssisted.pass, dimension.modelAssisted.reviewed)
    }
  }));
}

export function headlineTotals(dimensions) {
  const totals = dimensions.reduce((sum, dimension) => ({
    cases: sum.cases + dimension.cases,
    errors: sum.errors + dimension.errors,
    automaticEligible: sum.automaticEligible + dimension.automatic.eligible,
    automaticPass: sum.automaticPass + dimension.automatic.pass,
    humanReviewed: sum.humanReviewed + dimension.human.reviewed,
    humanPass: sum.humanPass + dimension.human.pass,
    humanMostlyPass: sum.humanMostlyPass + dimension.human.mostlyPass,
    modelReviewed: sum.modelReviewed + dimension.modelAssisted.reviewed,
    modelPass: sum.modelPass + dimension.modelAssisted.pass,
    modelMostlyPass: sum.modelMostlyPass + dimension.modelAssisted.mostlyPass
  }), { cases: 0, errors: 0, automaticEligible: 0, automaticPass: 0, humanReviewed: 0, humanPass: 0, humanMostlyPass: 0, modelReviewed: 0, modelPass: 0, modelMostlyPass: 0 });
  return {
    ...totals,
    automaticPassRate: percent(totals.automaticPass, totals.automaticEligible),
    humanCoverage: percent(totals.humanReviewed, totals.cases),
    humanPassRate: percent(totals.humanPass, totals.humanReviewed),
    modelCoverage: percent(totals.modelReviewed, totals.cases),
    modelPassRate: percent(totals.modelPass, totals.modelReviewed)
  };
}
