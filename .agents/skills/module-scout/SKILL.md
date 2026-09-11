---
name: module-scout
description: Read-only discovery for an unfamiliar module or bug. Use to identify relevant files, current flow, root cause candidates, and the smallest implementation plan. Do not use when implementation should begin immediately from already-known files.
---

# Module Scout

Operate in read-only mode.

## Workflow

1. Inspect `git status --short`.
2. Identify the requested module, route, API service, types, query keys, locales, and focused tests.
3. Use targeted `rg` searches; do not scan the whole repository.
4. Trace the current behavior from UI action to API/query/store and back to rendered state.
5. Check directly related shared consumers only.
6. Do not edit files.
7. Do not run the full test suite or production build.

## Output

Return at most 15 lines:

1. relevant files
2. current flow
3. proven finding or highest-confidence root-cause candidates
4. missing information
5. smallest implementation plan
