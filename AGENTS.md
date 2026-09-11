# Rafal Dashboard agent guidance

Before changing this repository:

1. Run `git status --short` and inspect the current diff. Preserve existing and unrelated work.
2. Read only the `docs/` files directly relevant to the requested module, business rule, architecture, or validation path. Do not scan all documentation by default.
3. Inspect the existing module implementation and latest shared components before creating a new primitive, abstraction, service, query key, or utility.
4. Follow the existing feature/module architecture and the conventions of the module being changed.
5. Keep HTTP calls in services and server state in TanStack React Query.
6. Put shareable filters in URL search parameters rather than component state.
7. Use existing i18n resources for all visible and accessible text; preserve English, Arabic, and RTL behavior.
8. Preserve semantic HTML, keyboard operation, visible focus, responsive layouts, and stable loading dimensions.
9. Do not reload pages or add avoidable requests to reconcile mutations. Update caches safely and invalidate narrowly.
10. Avoid duplicate requests, effects, listeners, timers, SDK instances, iframe runtimes, and duplicated local state.
11. Never log or persist passwords, Bearer tokens, signatures, ZAK, passcodes, meeting credentials, or other secrets.
12. Do not use destructive Git commands such as `git reset`, `git restore .`, `git checkout .`, or `git clean`.
13. Do not install, remove, or upgrade dependencies unless the task explicitly requires it.
14. Do not perform unrelated refactors, cleanup, renames, or formatting.
15. Add focused Vitest/React Testing Library coverage for changed behavior.
16. Run scoped checks first:
    - changed-file formatting
    - changed-file lint
    - focused tests
    - targeted TypeScript validation
17. Run broader repository validation only when shared infrastructure changed, the task is release-critical, or the user explicitly requests it.
18. Do not fix unrelated modules merely to make a command green. Record evidence-backed unrelated failures instead.
19. Never claim a test, check, build, browser E2E, or visual review passed unless it was actually executed.
20. Keep final reports concise: root cause, changed files, implemented behavior, validation results, and remaining blockers.

## Working scope

- Work only on the requested module and directly related shared files.
- Prefer targeted `rg` searches and focused file reads.
- Do not scan the entire repository unless the task genuinely requires it.
- Shared changes require checking directly affected consumers and focused regression coverage.
- Treat the committed repository and current working tree as the source of truth.
- Do not create or amend commits unless explicitly requested.

## Project skills

Use the matching skill when its workflow applies:

- `$module-scout` — read-only discovery and smallest implementation plan.
- `$scoped-implementer` — focused implementation inside one module.
- `$scoped-verifier` — scoped validation without broad refactoring.
- `$diff-reviewer` — review the current Git diff only.
- `$incident-debugger` — reproduce and fix lifecycle, race-condition, stale-state, SDK, iframe, or production incidents.
