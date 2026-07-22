# Maintainer setup

## One-time GitHub setup

1. Create the public repository `SafeAI4Humanity/ai4h-evaluation-results` from this directory and push `main`.
2. In **Settings → Pages**, select **GitHub Actions** as the source.
3. Confirm that **Publish evaluation data** succeeds. It publishes the generated endpoint at `https://safeai4humanity.github.io/ai4h-evaluation-results/`.
4. Protect `main` so result submissions arrive through pull requests and require the **Validate evaluation submissions** check.
5. Optionally require CODEOWNER or maintainer approval before merge.

The AI4H website is already configured to read `index.json` from that GitHub Pages project URL. No cross-repository token is required.

## Publishing an accepted submission

1. Review the pull request's consent statements and methodology notes.
2. Inspect raw responses and review notes for personal data, credentials, dangerous operational material, or content that should not be redistributed.
3. Confirm the validation workflow passes.
4. Merge the pull request.
5. The Pages workflow regenerates the model index, model cards, and full submission evidence.
6. Confirm the model appears at `https://ai-4-h.org/model-evaluations/` after normal website/CDN caching.

## Corrections and withdrawal

Do not rewrite accepted raw evidence silently. Add a superseding submission and document the relationship in methodology notes. For urgent privacy or safety issues, remove the affected public file, record the reason in the repository history, and rebuild the generated data.

## Scoring rules

- Automatic pass rate: cases where every non-human evaluator passes, divided by cases with at least one non-human evaluator.
- Human pass rate: latest strict human pass verdicts divided by human-reviewed cases. `mostly_pass` is reported separately and is not silently counted as a full pass.
- Human coverage: human-reviewed cases divided by all cases in the dimension.
- Model-assisted pass rate and coverage use the latest saved model review and remain explicitly provisional. Model-assisted `mostly_pass` is also reported separately from a strict pass.
- Errors are reported separately.
- No composite safety score is generated.
