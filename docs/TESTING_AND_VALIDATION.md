# Testing and validation

## Tooling

The repository uses Vitest 3, React Testing Library, `@testing-library/user-event`, jsdom, and the shared setup in `src/test/setup.ts`. Keep tests in the existing framework; do not add another runner.

Tests should verify user-observable behavior and public module contracts rather than private implementation details. Use deterministic fake timers for due dates, active windows, countdowns, and session-duration behavior.

## Scoped validation first

Start with the smallest affected surface. For the Tasks/Assignments/Exams program, run:

1. Tasks service, query, mapping, route/action, loading/error/empty, role, and locale tests.
2. Assignment list/detail/submission/extension/cache tests.
3. Exam list/guard/timing/MCQ/Online/analysis/cache tests.
4. Tests for any changed shared component.
5. Shared and domain date-helper tests.
6. Type and lint checks covering changed files.

Examples of focused commands:

```sh
yarn vitest run src/modules/users/tasks
yarn vitest run src/modules/users/assignments
yarn vitest run src/modules/users/exams
yarn eslint src/modules/users/tasks --max-warnings=0
```

## Required repository validation

After scoped checks pass, run each applicable repository command independently:

```sh
yarn typecheck
yarn lint:strict
yarn test
yarn build
yarn format:check
```

The current `yarn typecheck` script runs `tsc -b --pretty false --force`, so it checks the configured TypeScript project references rather than only transpiling the active feature.

Do not claim a command passed if it was not executed or if only a narrower command ran.

## What to test

- Service URL, query, multipart payload, cancellation signal, and response mapping.
- Query keys, role/type/status/filter separation, freshness/retry policy, deduplication, and disabled protected requests.
- URL normalization, direct refresh, Back/Forward behavior, and canonical route matching.
- Role and time guards for both hidden actions and manually entered URLs.
- Initial loading, initial error/retry, empty data, malformed data, background error, next-page error/retry, missing files, and forbidden/not-found states.
- Optimistic cache changes across multiple loaded pages, missing destination caches, duplicate IDs, exact rollback, and targeted `refetchType: 'none'` invalidation.
- Accessible names, heading structure, keyboard actions, focus movement, error summaries, and status text.
- English/Arabic locale key parity and important interpolated/pluralized output.
- Responsive class contracts and skeleton structure where a browser-level layout assertion is not available.

## Visual validation

When browser/screenshot tooling is available, compare every supplied scenario in English and Arabic/RTL at desktop, tablet, and mobile widths. Inspect container width, section rhythm, typography, cards, tabs, badges, buttons, upload areas, timelines, footer behavior, overflow, and skeleton-to-content movement. Record which routes, locales, and viewport sizes were actually checked.

## Unrelated failures

Do not edit an unrelated module simply to make validation green. A failure may be classified as unrelated only with evidence:

1. Record the exact command and full error.
2. Record the exact file and stack trace or compiler/lint location.
3. Compare that file with the current Git diff.
4. Explain why the changed surface cannot cause the failure.
5. Continue every remaining validation command that can run.
6. Report the failure prominently in the final handoff.

Never hide failures through skipped tests, weakened compiler/lint settings, `@ts-ignore`, unsafe casts, or blanket lint-disable comments.
