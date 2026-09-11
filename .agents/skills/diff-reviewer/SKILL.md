---
name: diff-reviewer
description: Review only the current Git diff for correctness, regressions, security, accessibility, stale state, cleanup, API mapping, and missing tests. Use before merge or release. Do not re-audit unchanged modules.
---

# Diff Reviewer

Review the current diff only.

## Workflow

1. Read `git status --short`, `git diff --stat`, and `git diff`.
2. Inspect directly affected consumers only when needed to verify compatibility.
3. Look for:
   - business regressions
   - incorrect API or type mapping
   - stale state and race conditions
   - duplicate requests/effects/listeners
   - missing cleanup
   - security or credential exposure
   - accessibility and RTL regressions
   - cache invalidation errors
   - missing focused tests
4. Ignore purely stylistic preferences already handled by formatter/linter.
5. Do not edit unless explicitly requested.

## Output

Return findings ordered by severity:

- blocker
- high
- medium
- low

For each finding include file, evidence, impact, and smallest safe fix.

If no findings exist, say so and state the validation gap that still remains.
