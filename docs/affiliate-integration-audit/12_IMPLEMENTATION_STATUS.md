# Frontend Affiliate completion status

2026-11-26. Baseline: branch feat/affiliate, HEAD 023d758. The earlier nullable-settings working-tree changes were preserved and extended. No commit, push, merge or deployment was performed.

## IMPLEMENTED_AND_TESTED_LOCALLY

Existing behavior retained: six-field nullable settings, published-page pagination, dirty/discard/422/disable confirmation; Affiliate URL filters/list pagination/meta.totals/CSV; creation/profile/status/reset interactions; application list/detail/pending counter/approval/rejection/409; payout forms/validation/warnings; optional order attribution and coupon collision handling.

This task adds name-based code generation with cancellation and draft-race protection; optional financial detail/history adapters and URL pagination; payout amount/reference/date/reason presentation; order-to-Affiliate links gated by verified view access; in-memory verified-grant preparation and exact route/navigation/query/action/service checks; stale-session 403 suppression; and financial read-back enforcement across dialog closure. More precise minimum-payout drafts remain strings rather than silently rounding through Number. EN/AR strings and existing components are reused. Shared Button.permissionName remains inert.

Changed areas: src/modules/affiliates/{api,schemas,types,queries,hooks,components,pages,config,locale}; src/store/auth.ts (in-memory grant lifecycle); src/config/axios.ts (stale 403); src/modules/dashboard/layout/DashboardNavItem.tsx (Affiliate-only filtering); src/modules/orders/components/OrderAffiliateSection.tsx (conditional link); associated focused tests. No dependencies or release flag values changed. A separate .env.example modification appeared during execution and was left untouched.

Validation: 484 tests passed across 49 files (90.94s). Full TypeScript build-mode validation passed after separating read-only selected-page metadata from the six-field form type. Changed-source ESLint (zero warnings), Prettier and git diff --check passed. Vite production build passed (17.23s), with the existing >500 kB chunk advisory. The source adapters and tests are local evidence only. Selected published-page metadata from settings now supports a selection outside the loaded options page; loaded unpublished options take precedence.

Commands used with installed Node 24.19.0:

- node node_modules/vitest/vitest.mjs run src/modules/affiliates src/modules/orders src/modules/coupons src/modules/auth src/modules/dashboard/layout src/store/auth.test.ts src/config/axios.helpers.test.ts src/config/axios.auth-boundary.test.ts src/utils/apply-api-validation-errors.test.ts src/utils/error src/utils/create-http-client.test.ts src/routes/routes.test.tsx --maxWorkers=2 --minWorkers=1
- node node_modules/typescript/bin/tsc -b --pretty false --force
- node node_modules/eslint/bin/eslint.js --max-warnings=0 <changed and new TS/TSX files>
- node node_modules/prettier/bin/prettier.cjs --check <changed and new TS/TSX/locale JSON files>
- node node_modules/vite/bin/vite.js build

Initial test failures were task-owned expectations/selectors and were corrected; the final regression run is green. An initial ESLint invocation included locale JSON outside its configured scope; the corrected source-only invocation passed. No unrelated code was modified to make checks pass. The final diff review addressed selected-page metadata precedence, unknown-grant closure, stale 403 identity handling, code-generation races and payout read-back locking.

## IMPLEMENTED_PENDING_SMOKE_TEST

Every prepared workflow still needs live Laravel acceptance, especially generator/detail nesting and history pagination assumptions enumerated in document 11. No successful unit test or build is classified as VERIFIED_AGAINST_LIVE_API.

## BACKEND_DEPENDENCY

Only the authoritative current-staff effective-permission source remains confirmed as a Backend dependency. The session integration seam has no production hydration caller until that source is supplied and verified.

## RELEASE_BLOCKER

Verified permissions hydration, authorized live/browser acceptance and release approval remain outstanding. All existing gates remain closed. Financial live mutation tests require explicit disposable-payout authorization. The requested nullable-settings smoke was not executed because authenticated access and disposable-data safety could not be established; no state changed, no restore was needed, and no HTTP status is available.

The exact manual checklist is in document 07. Historical delivery notes below are retained for traceability and are not active Backend requests.

## Working-tree file inventory

This is the combined diff, including the earlier nullable-settings work preserved at task start. It does not imply every line was introduced by this task.

| Path | Purpose |
| --- | --- |
| .env.example | Separate modification appeared during execution; not edited by this task and left untouched. |
| docs/affiliate-integration-audit/07_BACKEND_HANDOFF.md | Current evidence, assumptions, dependency classification and smoke instructions; history retained. |
| docs/affiliate-integration-audit/10_ACTIVE_BACKEND_BLOCKERS.md | Current evidence, assumptions, dependency classification and smoke instructions; history retained. |
| docs/affiliate-integration-audit/11_CONSOLIDATED_BACKEND_MISSINGS.md | Current evidence, assumptions, dependency classification and smoke instructions; history retained. |
| docs/affiliate-integration-audit/12_IMPLEMENTATION_STATUS.md | Current evidence, assumptions, dependency classification and smoke instructions; history retained. |
| docs/affiliate-integration-audit/BACKEND_CONTRACT_GAP_MATRIX.md | Current evidence, assumptions, dependency classification and smoke instructions; history retained. |
| src/config/axios.auth-boundary.test.ts | Focused behavior or regression coverage; synthetic fixtures only. |
| src/config/axios.ts | Prevent stale-session 403 from redirecting or notifying a newer session. |
| src/modules/affiliates/README.md | Current evidence, assumptions, dependency classification and smoke instructions; history retained. |
| src/modules/affiliates/api/affiliate-review.service.test.ts | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/api/affiliate-review.service.ts | Permission-enforced shared transport, conservative normalization and payout read-back enforcement. |
| src/modules/affiliates/api/affiliates.service.test.ts | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/api/affiliates.service.ts | Permission-enforced shared transport, conservative normalization and payout read-back enforcement. |
| src/modules/affiliates/components/AffiliateDetailsHeader.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/components/AffiliateDetailsSections.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/components/AffiliateForm.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/components/AffiliatePayoutDecision.test.tsx | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/components/AffiliatePayoutDecision.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/components/AffiliateSettingsForm.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/hooks/useAffiliate.ts | Permission-aware query enablement and history page keys. |
| src/modules/affiliates/hooks/useAffiliateSettings.ts | Permission-aware query enablement and history page keys. |
| src/modules/affiliates/hooks/useAffiliates.ts | Permission-aware query enablement and history page keys. |
| src/modules/affiliates/locale/ar.json | EN/AR generation, history and amount labels. |
| src/modules/affiliates/locale/en.json | EN/AR generation, history and amount labels. |
| src/modules/affiliates/pages/AffiliateApplicationDetailPage.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/pages/AffiliateApplicationsPage.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/pages/AffiliateDetailPage.test.tsx | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/pages/AffiliateDetailPage.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/pages/AffiliatePayoutDetailPage.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/pages/AffiliatePayoutsPage.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/pages/AffiliateReviews.test.tsx | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/pages/AffiliateSettingsPage.test.tsx | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/pages/AffiliateSettingsPage.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/pages/AffiliatesPage.test.tsx | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/pages/AffiliatesPage.tsx | Affiliate UI behavior, permission gating, conservative data presentation or preserved nullable settings. |
| src/modules/affiliates/queries/affiliates.keys.ts | Permission-aware query enablement and history page keys. |
| src/modules/affiliates/schemas/affiliate-api.schema.ts | Optional financial/history and selected-page metadata types; exact money strings. |
| src/modules/affiliates/schemas/affiliate-settings.schema.test.ts | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/schemas/affiliate-settings.schema.ts | Preserved prior nullable-settings validation. |
| src/modules/affiliates/types/affiliate.types.ts | Optional financial/history and selected-page metadata types; exact money strings. |
| src/modules/dashboard/layout/DashboardNavItem.tsx | Affiliate-only navigation permission checks. |
| src/modules/orders/components/OrderAffiliateSection.tsx | Permission-gated Affiliate detail link; preserve unrelated Orders behavior. |
| src/store/auth.test.ts | Focused behavior or regression coverage; synthetic fixtures only. |
| src/store/auth.ts | Unknown/verified in-memory grants and identity-bound hydration seam. |
| src/modules/affiliates/components/AffiliateForm.test.tsx | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/config/affiliate-access.test.ts | Focused behavior or regression coverage; synthetic fixtures only. |
| src/modules/affiliates/config/affiliate-access.ts | Exact action policy plus existing release/readiness gates. |

<details>
<summary>Historical record before this frontend completion task; superseded by the active status above</summary>

# EPIC-11 implementation delivery

2026-11-26. Local implementation against the approved guide extraction and the explicit totals/payout/settings/order contract excerpts supplied in the targeted completion request. This status supersedes the earlier delivery summary where totals and payout form preparation were deferred. Original PDF unavailable; no fresh PDF or deployed Laravel verification. No live Backend requests, financial decisions, messages, commits, pushes or deployment were performed.

## Capability status

| Workstream         | Classification                                                                                      | Delivered / remaining                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation         | IMPLEMENTED_AND_VERIFIED for local transport changes; PARTIALLY_IMPLEMENTED for authorization       | Shared staff HTTP client, one api/v1 prefix, normalized X-Locale, opt-in Backend text/422 errors, abort behavior, auth/cache fences and closed routes. Effective-grants hydration and per-action checks blocked by B01.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Settings           | PARTIALLY_IMPLEMENTED                                                                               | Real GET/full PUT mapping, six fields, percentage/range validation, published-page selector, draft/discard/disable confirmation and read-only mode. The documented numeric/non-null PUT and explicitly requested null/clear handling are supported. Production writes stay closed by B01 and page-access/staging readiness; B02 concerns live null acceptance/persistence and settings-only page access. Unknown page titles are not invented.                                                                                                                                                                                                                                                                                              |
| List/create/export | IMPLEMENTED_AWAITING_LARAVEL_VERIFICATION for implemented operations; PARTIALLY_IMPLEMENTED overall | URL filters/pagination, source/order counts/exact balances, optional code, Saudi phone/account_handle mapping, 422 collisions, truthful SMS-false handling and CSV export. Four documented totals cards render exact SAR strings and open-request count/amount, with unavailable fallback for absent/malformed totals; filter scope remains unconfirmed; generator DEFERRED with manual/omitted-code fallback.                                                                                                                                                                                                                                                                                                                              |
| Detail/management  | PARTIALLY_IMPLEMENTED                                                                               | Date-range reads, profile/source/application/login/terms metadata, sparse PUT, suspend/reactivate reasons, confirmed reset and actual SMS outcome. Refetch authoritative detail after partial writes; preserve drafts. Financial/orders/payout/masked-bank sections await B03 nesting. No activity endpoint.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Applications       | IMPLEMENTED_AWAITING_LARAVEL_VERIFICATION for core workflow; PARTIALLY_IMPLEMENTED enrichment       | Filtered paginated list, pending count, customer/detail context, proposed code in approval, approval/rejection, SMS outcome, no automatic retries, 409 reconciliation and immediate Affiliate link. Unknown actor/other-accounts/history linkage omitted. All exposure blocked by B01.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Payouts            | PARTIALLY_IMPLEMENTED; financial decisions BLOCKED                                                  | Closed list/detail routes, status filter/pagination, full IBAN limited to payout surface, exact available balance and warning. Paid/reject dialogs, reference/date/reason validation, request methods, pending-only actions, duplicate prevention, draft retention and 409 reconciliation are implemented behind a separate closed decision gate. Browser-local today is the explicit preparation fallback pending business-timezone confirmation. Generic acknowledgments never produce financial success messages or client balance updates. Network/5xx/parse ambiguity disables resubmission in the open dialog and requires checking server state. Live activation still awaits B01/B03 and controlled staging. No fabricated success. |
| Orders/Coupons     | IMPLEMENTED_AWAITING_LARAVEL_VERIFICATION                                                           | Optional order attribution, server discount/commission/refund adjustment values; legacy shape preserved when absent/null. Affiliate navigation withheld without grants. Coupon create/edit displays Backend code collision text and preserves draft.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Mock retirement    | IMPLEMENTED_AND_VERIFIED locally                                                                    | Removed mock client/token/env dependency, old activity/suggestion requests, PATCH/version settings behavior, old runtime DTO/error assumptions and development notices. Synthetic test fixtures retained.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Implementation and architecture

Primary changes are under `src/modules/affiliates/{api,schemas,types,hooks,components,pages,locale}`. New review service/pages implement application and payout reads, and application decisions. Existing FormWrapper/FormInput/FormSelect, QueryStateBoundary, ResponsiveDataLayout, confirmation dialogs, shared pagination, TanStack Query and download helpers are reused. No dependency versions, framework, global auth model or second HTTP client were introduced.

Directly related shared changes: `src/config/axios.helpers.ts`, opt-in helpers under `src/utils`, closed route/sidebar registration, and removal of mock environment definitions. Orders schema/mapper/layout and the new OrderAffiliateSection consume server values. CouponForm opts into Backend messages only for `code`. New focused tests sit beside these changes. The user's API host edit in `.env.example` is preserved. Original audit/T01 documents remain unchanged; documents 10–12 contain this delivery's updates.

## Validation evidence

- Locked dependency restoration succeeded using Yarn 1 frozen lockfile and ignore-scripts. package.json/yarn.lock unchanged. Direct installed Node 24.19.0 used because the launcher was unreliable.
- Restored original Affiliate baseline: 63 tests passed across 7 files.
- Targeted completion regression run: **426 tests passed across 43 files**, exit 0 (Affiliate, Orders, Coupons, Auth, auth store, route and shared HTTP/error helpers). This replaces the previous 390-test delivery count.
- Added coverage: valid/missing/malformed/precise totals, latest-page metadata and search changes; payout field boundaries, invalid/future dates, pending/closed gates, duplicate submission, 422 draft retention, ambiguous network results, 409 reconciliation and Arabic RTL; documented string Order percentages/rates and negative adjustments; numeric/non-null settings and unrelated settings-read preservation.
- TypeScript project build check: passed (`tsc -b --pretty false`).
- Changed/new source-file ESLint: passed. Changed/new source-file Prettier check: passed.
- Vite production bundle: passed; emitted >500 kB chunk-size advisory. No bundle-splitting refactor included.
- Browser E2E, visual/mobile review and live Laravel compatibility: **not run**. EN/AR, RTL and responsive DOM behavior were exercised by synthetic component tests; that is not browser visual acceptance.
- The auth redirect test emits jsdom's unsupported document-navigation notice; assertions pass. Initial intermediate failures (legacy order shape, test text encoding, missing ResizeObserver in the new coupon test, empty environment interface) were fixed and the relevant checks rerun.
- Complete tracked/untracked review covered new services/pages/components/schemas/tests and directly changed Orders/Coupons/routes/HTTP code. A review finding was corrected: profile/status reconciliation cancelled all Affiliate queries, potentially aborting unrelated settings reads. Cancellation now targets the affected detail/list, with two regression cases. No dangling imports, runtime Mock requests/tokens or permission bypass were found. TypeScript, route tests and bundling validate imports and route composition.
- Initial targeted test failures were selectors using searchbox instead of the shared text input, and an exact label omitting the required-field marker. Both corrected; full regression rerun passed. No unrelated production changes were needed.

## Handoff and readiness

All urgent messages in `10_ACTIVE_BACKEND_BLOCKERS.md` and the single deduplicated message in `11_CONSOLIDATED_BACKEND_MISSINGS.md` are **READY TO SEND — NOT SENT**.

Local code is available for review and controlled staging preparation. Protected end-to-end staging verification requires an authorized environment and authoritative grants implementation first; settings-only page access and financial activation additionally require their relevant contract answers. The ordinary non-null settings payload itself is no longer classified as unavailable. Do not simply toggle feature flags. Production rollout is **NO-GO** while B01/B02/B03 remain unresolved. The available implementation is intentionally partial, with missing financial data omitted and sensitive operations closed.

## Targeted review verdict and working-tree inventory

**BLOCKED for production activation; targeted local implementation verified.** No unresolved local code finding was identified beyond the documented authorization/contract activation boundaries and unexecuted browser/live verification.

Current Git inventory: **60 tracked changed paths** (including 3 intentional obsolete-file deletions), **28 untracked files** (16 source/test files and 12 existing audit/handoff documents), **0 staged files**. Untracked files were included in TypeScript, formatting, lint, tests and review; none was omitted merely because ordinary git diff excludes it. No dependency or lockfile changes. The user's .env.example API host was preserved, with no further edit in this pass. No staging/commit/push/deployment or live Backend requests.

Untracked source/test inventory:

- src/modules/affiliates/api/affiliate-review.service.test.ts
- src/modules/affiliates/api/affiliate-review.service.ts
- src/modules/affiliates/components/AffiliateExportButton.tsx
- src/modules/affiliates/components/AffiliatePayoutDecision.test.tsx
- src/modules/affiliates/components/AffiliatePayoutDecision.tsx
- src/modules/affiliates/hooks/affiliate-auth-boundary.test.tsx
- src/modules/affiliates/pages/AffiliateApplicationDetailPage.tsx
- src/modules/affiliates/pages/AffiliateApplicationsPage.tsx
- src/modules/affiliates/pages/AffiliatePayoutDetailPage.tsx
- src/modules/affiliates/pages/AffiliatePayoutsPage.tsx
- src/modules/affiliates/pages/AffiliateReviews.test.tsx
- src/modules/affiliates/schemas/affiliate-payout.schema.test.ts
- src/modules/affiliates/schemas/affiliate-payout.schema.ts
- src/modules/coupons/components/CouponForm.test.tsx
- src/modules/orders/**tests**/orders.affiliate.test.tsx
- src/modules/orders/components/OrderAffiliateSection.tsx

Verification commands (using the installed Node 24.19.0 executable directly):

- node node_modules/vitest/vitest.mjs run src/modules/affiliates src/modules/orders src/modules/coupons src/modules/auth src/store/auth.test.ts src/config/axios.helpers.test.ts src/config/axios.auth-boundary.test.ts src/utils/apply-api-validation-errors.test.ts src/utils/error src/utils/create-http-client.test.ts src/routes/routes.test.tsx --maxWorkers=2 --minWorkers=1
- node node_modules/typescript/bin/tsc -b --pretty false
- node node_modules/eslint/bin/eslint.js <explicit changed and untracked TS/TSX files>
- node node_modules/prettier/bin/prettier.cjs --check <explicit changed and untracked source files>
- node node_modules/vite/bin/vite.js build
- git diff --check

The original PDF remains unavailable. No fresh PDF, browser E2E or live Laravel verification is claimed. The nullable-settings smoke test is explicitly authorized but blocked by unavailable authenticated staff access; production activation still requires real permission hydration; financial activation additionally requires result interpretation/business-date confirmation. All prepared Backend messages remain READY TO SEND — NOT SENT.

## Nullable terms-page follow-up - 2026-11-26

Form validation, the selector clear action and the service guard now allow explicit null while retaining all six PUT fields. Existing API schemas, TypeScript types and normalization already preserve null. Gates are unchanged. Local synthetic verification: 61 tests across settings UI, service and validation passed; changed-source ESLint and Prettier, full TypeScript build-mode validation and the production Vite build passed (existing large-chunk advisory). Live initial GET, PUT, verification GET and restoration GET were not executed because authenticated staff access was unavailable. No live settings were changed; restoration was not required. Laravel null acceptance remains unverified (document 10, B02).

</details>
