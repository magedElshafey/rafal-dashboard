---
name: scoped-implementer
description: Implement a focused feature or bug fix inside one named module with minimal shared changes and scoped validation. Use for normal React and TypeScript implementation tasks. Do not use for repository-wide audits.
---

# Scoped Implementer

Implement only the requested behavior.

## Workflow

1. Inspect `git status --short`.
2. Read only the named module and directly related shared files.
3. Trace the current flow before editing.
4. Reuse existing types, services, query keys, components, and locale conventions.
5. Make the smallest safe change.
6. Inspect consumers before changing a shared file.
7. Add or update focused regression tests.
8. Run changed-file formatting, changed-file lint, scoped tests, and targeted type validation.
9. Run broader validation only when shared infrastructure changed or the task is release-critical.

## Guardrails

- No unrelated cleanup or refactoring.
- No destructive Git commands.
- No dependency changes without explicit need.
- No secret logging or persistence.
- No broad query-cache invalidation.
- No behavior, design, route, or API changes outside scope.
- Do not narrate routine progress.

## Output

Return at most 20 lines:

1. root cause
2. files changed
3. behavior implemented
4. validation results
5. remaining blocker or risk
