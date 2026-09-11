---
name: incident-debugger
description: Reproduce and fix production blockers involving lifecycle failures, race conditions, stale credentials, duplicate clients, refresh behavior, SDK or iframe integration, or hard-to-prove state bugs. Use only for complex incidents, not ordinary UI changes.
---

# Incident Debugger

Prove the root cause before applying a fix.

## Workflow

1. Inspect repository and runtime state before editing.
2. Reproduce the issue using the smallest real scenario available.
3. Trace the exact event/request/state sequence.
4. Add temporary sanitized diagnostics only when necessary.
5. Never log credentials, tokens, passcodes, signatures, or sensitive payloads.
6. Classify where the failure occurs:
   - request
   - response mapping
   - cache/store
   - lifecycle transition
   - bridge/message protocol
   - SDK callback
   - cleanup
   - rendering
7. Apply the smallest architectural fix.
8. Add a focused regression test for the proven failure.
9. Remove or development-gate temporary diagnostics.
10. Run focused validation, then real browser E2E when the incident depends on runtime behavior.

## Guardrails

- No blind delays, forced UI reveals, infinite retries, or broad cache clears.
- No claim of production readiness from mocks only.
- Preserve unrelated modules and existing work.

## Output

Return:

1. expected sequence
2. actual sequence
3. exact root cause
4. fix
5. tests and real validation
6. remaining external limitation
