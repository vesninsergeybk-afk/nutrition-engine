# CI feedback protocol

This repository uses two CI levels so iterative work does not repeatedly launch the
full release matrix.

## 1. Active work: keep the PR in Draft

Every commit to a draft PR runs **Fast draft feedback** only.

It checks:
- runtime inventory / missing required files;
- JavaScript, PHP, JSON and HTML integrity;
- permissions and secret scan;
- client guard stability;
- hosting closure.

This is a structural feedback gate, not a release gate.

## 2. Release candidate: mark the PR Ready for review

Ready PRs run the canonical release-candidate boundary:
- full core and safety suite;
- Chromium, Firefox and WebKit functional browser contract;
- empty-state UI audit and filled real user journey in Chromium;
- WCAG audit in Chromium.

Firefox repeats the full WCAG matrix after merge to `main` (and in manual
browser/full runs). WebKit remains an obligatory functional browser contract.

## 3. Main remains the final verification boundary

Every push to `main` runs the full core and three-browser matrix, including
Chromium + Firefox WCAG checks. A merge is therefore verified again independently
of the PR run.

## 4. Manual profiles

`workflow_dispatch` supports:
- `fast` — structural feedback only;
- `core` — full core/safety only;
- `browser` — three-browser contract + accessibility rules;
- `full` — canonical full gate.

Use a targeted manual profile when diagnosing one failed layer instead of rerunning
unrelated expensive jobs.

## 5. Working rule for ChatGPT / interactive development

- Do not wait for the full GitHub matrix after every patch.
- Keep the PR draft while several related patches are being made.
- Use fast feedback as the per-commit guardrail.
- Run the full gate once at a real milestone, before merge.
- If one full-gate job fails, inspect and rerun/fix that layer first; do not
  repeatedly poll every job.
- Treat CI as asynchronous: continue code review or the next independent task while
  Actions runs, then check the result at a deliberate checkpoint.

This keeps release confidence while avoiding repeated multi-browser work during
ordinary iteration.
