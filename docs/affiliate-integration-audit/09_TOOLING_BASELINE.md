# T01 local tooling baseline

Date: 2026-11-26 (Africa/Cairo). Branch `feat/affiliate`; HEAD `4d2592d5f6a2210623d5ec176ed93476bf48b851`. Git root discovered dynamically. This task changed documentation only; no dependency, configuration, test or application repair was attempted.

## Environment and diagnosis

- Shell: Windows PowerShell **5.1.26100.9818**. Execution policy scopes MachinePolicy/UserPolicy/Process/CurrentUser/LocalMachine all report **Undefined**. This does not establish an OS-wide process prohibition.
- PATH resolves `node` to the Author Software NVM `.nodejs/node.exe` shim. File metadata reports 1.0.0 and targets `.shim/node.exe`; that is launcher metadata, **not the Node runtime version**.
- A first combined `node --version; yarn --version` probe yielded no version text and shell exit 1. Separate redirected shim execution later hung with empty stdout/stderr. The redirected sequence was interrupted during its first `node --version`; its later commands did not execute. Separate shim-based Vitest and Prettier attempts also hung silently and were interrupted, returning 1. These are interrupted launcher attempts, not completed test/format failures.
- Read-only discovery under the local NVM installs directory found Node **23.6.0** and **24.19.0**. Direct execution of the installed **24.19.0** binary worked. No PATH, active NVM version, machine settings or repository configuration was changed. The selected PATH shim's effective runtime version remains unknown.
- Direct Node 24.19.0 execution of the installed Yarn `lib/cli.js` returned **1.22.22**, matching `package.json:5` (`yarn@1.22.22`). The existing `.yarnrc.yml` also has `nodeLinker: node-modules` and other settings; they were inspected, not rewritten.
- `node_modules` exists. Installed package manifests report Vitest **3.2.6**, Prettier **3.9.6**. Dependencies are incomplete: both `node_modules/@tiptap/react/package.json` and `node_modules/@tiptap/starter-kit/package.json` are absent, although both are declared in `package.json`.
- `vite.config.ts:18` uses jsdom and `src/test/setup.ts`, whose cleanup runs after each test. Existing React/Tailwind plugins and the `@` alias remain unchanged. No full test suite or production build was needed.

**Conclusion:** there are two observable problems: an unreliable/hanging NVM launcher in this execution context, and a missing declared dependency causing a specific suite-load failure when a real runtime is used. No evidence establishes that shell policy universally prevents Node tools from running. Direct Node runs prove they can execute locally. The exact underlying shim defect was not determined.

## Package scripts inspected

| Script                | Existing command                  |
| --------------------- | --------------------------------- |
| dev / preview         | `vite` / `vite preview`           |
| build                 | `tsc -b && vite build`            |
| test / test:watch     | `vitest run` / `vitest`           |
| format / format:check | `prettier -w .` / `prettier -c .` |
| lint                  | `eslint .`                        |
| lint:fix              | `eslint src --fix && yarn format` |
| lint:strict           | `eslint --max-warnings=0 src`     |
| typecheck             | `tsc -b --pretty false --force`   |
| prepare               | `husky install`                   |

Broad format/fix scripts were not run. There is no dedicated Affiliate script; the prior audit's targeted Vitest CLI command was used. ESLint/TypeScript/application build were not run because no application source changed and T01 specifically requests the test/format baseline.

## Exact command evidence

Local executable paths below were discovered on this machine, not copied from another computer. For reproducibility, the successful-runtime command prefix was:

```powershell
$runtime = 'C:/Users/geexar/AppData/Local/Author Software/nvm/installs/v24.19.0/node.exe'
```

| Command                                                                                                              | Native exit                            | stdout                                        | stderr / interpretation                                   |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| `node --version; yarn --version` initial combined probe                                                              | Shell 1; individual codes not captured | No version output                             | No diagnostic; cannot assign individual failure causes    |
| `node --version` redirected probe                                                                                    | 1 after manual interruption            | Empty                                         | Empty; remained running, not a completed version check    |
| `node node_modules/vitest/vitest.mjs run src/modules/affiliates --maxWorkers=2 --minWorkers=1`                       | 1 after manual interruption            | Empty                                         | Empty; shim hang, not a test result                       |
| `node node_modules/prettier/bin/prettier.cjs --check 'docs/affiliate-integration-audit/*.md'`                        | 1 after manual interruption            | Empty                                         | Empty; shim hang, not formatting diagnostics              |
| `& $runtime --version`                                                                                               | 0                                      | `v24.19.0`                                    | Empty                                                     |
| `& $runtime 'C:/Program Files (x86)/Yarn/lib/cli.js' --version`                                                      | 0                                      | `1.22.22`                                     | Empty                                                     |
| `& $runtime node_modules/vitest/vitest.mjs run src/modules/affiliates --maxWorkers=2 --minWorkers=1`                 | **1**                                  | **6 files passed, 1 failed; 54 tests passed** | Settings suite import resolution failure; details below   |
| `& $runtime node_modules/prettier/bin/prettier.cjs --check 'docs/affiliate-integration-audit/*.md'` before new files | **1**                                  | `Checking formatting...`                      | Six pre-existing audit files need formatting; names below |

For the direct-runtime Vitest and Prettier runs, stdout and stderr were captured separately into temporary `rafal-t01-vitest.stdout` / `.stderr` and `rafal-t01-prettier.stdout` / `.stderr` files under the current user's temporary directory. `$LASTEXITCODE` was captured immediately after each native command. The surrounding PowerShell reporting command returned 0; **that wrapper status does not override the native exit 1**. Windows PowerShell adds `NativeCommandError`/`RemoteException` metadata around redirected native stderr; the diagnostic itself is quoted below. No raw API/credential data exists in these logs.

### Affiliate tests: failed baseline, useful partial coverage

```text
RUN v3.2.6
PASS pages/AffiliatesPage.test.tsx                  8 tests
PASS schemas/affiliate-settings.schema.test.ts   15 tests
PASS api/affiliates.service.test.ts               8 tests
PASS schemas/affiliate.schema.test.ts            10 tests
PASS pages/AffiliateDetailPage.test.tsx           11 tests
PASS config/affiliate-feature.test.ts             2 tests
FAIL pages/AffiliateSettingsPage.test.tsx         suite failed to load
Test Files  1 failed | 6 passed (7)
Tests       54 passed (54)
Duration    16.33s
```

All paths above are relative to `src/modules/affiliates/`. These tests still exercise obsolete Mock contracts and do **not** certify Laravel compatibility.

Failure stderr:

```text
Error: Failed to resolve import "@tiptap/react" from
"src/components/form/FormEditor.tsx". Does the file exist?
Plugin: vite:import-analysis
File: src/components/form/FormEditor.tsx:1:41
import { EditorContent, useEditor } from '@tiptap/react'
```

The stack continues through Vite's `_formatLog`, `error`, `normalizeUrl`, `TransformPluginContext.transform`, `EnvironmentPluginContainer.transform` and `loadAndTransform` in the installed Vitest/Vite packages. Additional stderr contains React Router v7 future-flag warnings for `v7_startTransition` and `v7_relativeSplatPath` in the passing list/detail suites; these are not the suite failure.

The import path is explained locally: `src/modules/affiliates/components/AffiliateSettingsForm.tsx:7` imports FormInput from the form barrel; `src/components/form/index.ts:11` re-exports FormEditor; `src/components/form/FormEditor.tsx:1` imports the missing package. Neither these files nor `package.json` changed in T01. Classification: **pre-existing local dependency/install blocker**, not introduced by documentation and not a reason to rewrite the form import or weaken tests.

### Existing audit formatting: failed baseline

Prettier reported:

```text
[warn] docs/affiliate-integration-audit/BACKEND_CONTRACT_GAP_MATRIX.md
[warn] docs/affiliate-integration-audit/BACKEND_QUESTIONS_AND_QA.md
[warn] docs/affiliate-integration-audit/CURRENT_ARCHITECTURE.md
[warn] docs/affiliate-integration-audit/EXECUTIVE_AUDIT.md
[warn] docs/affiliate-integration-audit/IMPLEMENTATION_ROADMAP.md
[warn] docs/affiliate-integration-audit/MOCK_REMOVAL_PLAN.md
[warn] Code style issues found in 6 files. Run Prettier with --write to fix.
```

Classification: **pre-existing documentation formatting**, preserved as requested. Only the three newly authored T01 files are eligible for formatting in this task.

## Minimal follow-up and validation limits

Use the already installed direct runtime to run diagnostics, or repair/select the NVM runtime in the user's terminal so `node --version` completes. No runtime download is necessary for the demonstrated commands. In a separately authorized dependency-maintenance step, synchronize installed dependencies with the existing manifest/lockfile using the declared package manager, without upgrades or lockfile deletion; then rerun the exact focused Affiliate command. This task did not install/reinstall anything.

Full Affiliate baseline remains **failed** until the settings suite loads and passes. Pre-existing audit formatting remains failed until separately authorized cleanup. There were no live Laravel, staging, browser E2E, visual, lint, TypeScript or production-build checks. No claims about live SMS, financial writes or effective permission enforcement can be made.

## Final T01 document validation

- Direct Node 24.19.0 ran Prettier `--write` on exactly `07_BACKEND_HANDOFF.md`, `08_T02_EXECUTION_SPEC.md` and `09_TOOLING_BASELINE.md`, exit 0. No original audit file was formatted.
- The same direct-runtime Prettier command with `--check` and those three explicit paths returned **0**: stdout `Checking formatting...` followed by `All matched files use Prettier code style!`; stderr empty.
- A PowerShell reference check examined 56 explicit `src/...` references in the three deliverables, checked file existence and cited line bounds, and resolved their relative Markdown links: exit 0, no issues.
- `git diff --check`: exit 0. It checks the tracked diff, not the new untracked documentation; the new files receive the separate Prettier check.
- SHA-256 comparison confirmed `.env.example` and all six original audit documents are byte-for-byte unchanged from the pre-authoring snapshot.
- Final tracked diff remains exactly one insertion/one deletion in the pre-existing `.env.example` edit. Status shows the original six untracked audit files plus the three new deliverables; no application/test/dependency/configuration changes were introduced.
- Git continues to warn that the user's global ignore file is inaccessible; status/diff checks still complete. No Git settings were changed.
