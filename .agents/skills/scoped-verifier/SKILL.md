---
name: scoped-verifier
description: Validate an existing change with focused formatting, lint, type checks, tests, and directly affected regressions. Use after implementation or before handoff. Do not use to redesign or broadly refactor production code.
---

# Scoped Verifier

Validate the current change without expanding scope.

## Workflow

1. Inspect `git diff --name-only` and `git diff`.
2. Determine the affected module and direct shared consumers.
3. Run the smallest proving checks:
   - changed-file formatting
   - changed-file lint
   - focused module tests
   - targeted TypeScript validation
   - direct shared regressions
4. Run production build only when this is a release gate or shared infrastructure changed.
5. Classify failures as:
   - introduced by this task
   - pre-existing/unrelated
   - environment/tooling blocker
6. Do not edit production code unless the user explicitly asks or a tiny test-proven task regression must be corrected.

## Output

Return at most 20 lines:

1. checks passed
2. checks failed
3. exact relevant error
4. ownership of each failure
5. handoff readiness
