# Dependency-aware implementation roadmap

Audit only. These are future independently reviewable tasks, not changes made by this audit. S/M/L are relative effort, not calendar estimates. Commit-ready boundaries are recommended; no commit is authorized by this task.

## Architecture decisions

### D01 — Reuse shared staff HTTP with narrow feature DTO mapping

**Approach:** Affiliate services call existing $http with /dashboard paths against the configured /api/v1 base. Preserve current session/interceptor ownership. Map snake_case into deliberately separate list, detail, settings and mutation-result models at the service boundary.

**Alternative:** retain a feature Axios client or support both old/new wire contracts. Rejected: duplicates authentication/error ownership and extends obsolete assumptions.

**Trade-offs / maintainability:** more focused DTO migration now, less permanent branching. Existing UI changes are justified because fields and business rules changed; the old generic CRUD aspiration of a configuration-only swap does not override this user's real-contract migration.

**Security:** no feature token storage or manual Authorization; 401 boundary remains centralized. Never log request configs/credentials.
**Tests / risks:** request method/path/body/header/abort tests plus parser fixtures. Check composed prefix once; CSV uses existing responseType rather than another client.

### D02 — Effective permissions, separate from catalog and readiness

**Approach:** one confirmed effective-permissions snapshot owned by staff auth/session infrastructure, queried/cached if the eventual contract requires it. A small reusable capability check controls relevant routes, navigation, queries and actions. Default deny while unknown. Keep production readiness independent of permission grants.

**Alternatives:** derive grants from role names, use assignable catalog as grants, or show all actions and rely only on403. Rejected: none provides the required trustworthy UI behavior.

**Trade-offs:** blocked on a narrow backend contract; shared auth changes need focused regressions. Do not rewrite unrelated module authorization.
**Security:** backend remains enforcement authority, Super Admin only per verified semantics; no permissions-as-security claim.
**Tests / risks:** V/M/S/P combinations, expiry/revocation, new login, 403 preservation, direct deep links; no unauthorized data request while grants unknown.

### D03 — Strict documented values without brittle whole-object strictness

**Approach:** Zod validates consumed fields and identity/envelope types; tolerate unrelated additive fields. Preserve money as signed two-decimal strings, dates as date-only strings or offset timestamps as documented. Keep Yup/RHF form conventions and map server errors to form aliases. Distinct DTOs prevent list rows masquerading as detail.

**Alternatives:** make all fields optional, cast JSON, strict old profile everywhere, or convert every amount to Number. Rejected: hides failures or loses precision.

**Trade-offs:** unspecified nested detail schemas require samples; unknowns are not filled with fake zero values. Settings numeric examples need narrow clarification.
**Security:** no raw response JSON display. Explicit sensitive payout type prevents full IBAN entering general Affiliate models.
**Tests / risks:** missing required/nullable/additive fields, wrong entity IDs, negative values including -0.50 and large decimal strings. Reuse/adapt existing money presentation only after signed-value tests; no commission calculations.

### D04 — Authoritative mutations and narrowly invalidated caches

**Approach:** include URL filters/ranges in keys. Use returned complete resources only where contract guarantees completeness. Cancel older reads before replacement. Do not overwrite rich detail with a profile-only mutation result; merge only verified fields or invalidate exact affected detail variants. Update status/list membership safely and invalidate relevant aggregates/pending counts, never derive money locally.

**Alternative:** reload window, invalidate entire cache, optimistic financial arithmetic, or blanket setQueryData with every response. Rejected.

**Trade-offs:** some reads required when mutation result omits authoritative detail; avoid redundant refetch when complete data is returned.
**Security:** use existing auth-boundary epoch for late mutation writers; sensitive payout cache must not survive identity changes.
**Tests / risks:** in-flight old GET, logout during mutation, filtered multi-page rows, changed period, duplicate clicks, concurrency409. No automatic replay of decision/creation after ambiguous network result.

| Mutation | Cache behavior |
| --- | --- |
| Settings PUT | Replace verified singleton; preserve dirty draft during unrelated refetch; invalidate only dependent cached settings-derived data actually displayed |
| Create Affiliate | Seed only compatible entity result; invalidate Affiliate lists/totals; do not synthesize financial detail |
| Profile/status | Update verified profile/status fields; invalidate affected list variants and detail variants as needed; no undocumented activity invalidation |
| Reset password | Render SMS result; refresh only detail metadata that backend says changed; no unconditional list/activity request |
| Application approval/rejection | Reconcile application detail/list/pending_count; approval invalidates Affiliate list/totals; link returned ID;409 refresh relevant record/list once |
| Payout paid/rejected | Reconcile payout detail/list, affected Affiliate detail/balances and Affiliate aggregate totals; no client subtraction/addition;409 refresh affected request |
| Order status/refund effects | Preserve attributed snapshots on existing order mutation flow; invalidate known affected Affiliate financial queries when a relevant mutation occurs here; no commission recomputation |

### D05 — Backend message policy scoped to confirmed contracts

**Approach:** preserve guide's message/errors/SMS text as escaped strings; use translated fallback for network/malformed errors. Add explicit opt-in policy or narrow helper for Affiliate and coupon collision rather than silently changing all shared forms. Add X-Locale through the existing request owner with direct consumer regressions.

**Alternative:** raw Error.message/config rendering or globally replacing all error policy. Rejected.
**Trade-offs:** small intentional shared extension may be warranted; keep default semantics stable.
**Security:** no HTML interpretation, raw stack/config, secret copying or diagnostic logs.
**Tests / risks:** header locale normalization, duplicate toasts, backend Arabic response in English shell, markup safely escaped and nested422 aliases.

### D06 — Forms preserve drafts while adopting real writes

**Approach:** settings six-field PUT; profile sparse writable fields via PUT as guide allows; server422 authoritative. Confirm programme-off and password reset; require reasons. Replace slug with paginated published-page ID selection. Keep duplicate-submit locks, query states and EN/AR accessibility.

**Alternative:** keep old PATCH/version behind an adapter. Rejected because server does not document it.
**Trade-offs:** no optimistic concurrency guarantee for settings; clearly record backend last-write behavior as unresolved.
**Tests / risks:** dirty/pristine refetch, confirmation cancellation, field bounds, stale page/code availability and one submission.

### D07 — Incremental cutover with closed incomplete routes

**Approach:** migrate vertical slices behind explicit readiness gates; delete each obsolete contract when no consumer remains; final removal of mock environment/client after last cutover. Keep test fixtures. In production, rollback means hide a feature or revert a reviewed change, never silently fall back to fake data.

**Alternative:** expose all features immediately after base URL edit, or delete entire module/test folder. Rejected.
**Trade-offs:** short-lived development mixed state during migration, controlled and never advertised as complete.
**Security:** no mock Bearer/scenario variable in production bundle. Separate P-gated sensitive payout views.
**Tests / risks:** dev/prod gate matrices and final runtime-reference/bundle check.

### D08 — Affiliate Panel remains separate

**Approach:** external ownership decision for its own app or isolated area; separate token storage/auth flow/client. Dashboard staff work continues without implementing panel.
**Alternative:** reuse staff login/session. Rejected explicitly by guide p.1.
**Trade-offs:** separate deployment or carefully isolated app routing; boundaries matter more than hosting choice.
**Security/tests:** cross-token401, forced password/terms flow and logout are panel responsibility. No panel backend behavior inferred from staff login.

## Ordered phases and dependencies

1. Foundations: T01 → T02.
2. Existing features: T03 and T04 after T02; T05 after T04 contract/models.
3. Application review: T06 after T04 and T02.
4. Missing staff/cross-module features: T07 after T05; T08 after T02 and verified detail-link rollout; T09 after T02.
5. Final mock retirement: T10 after T03–T05; final production programme completeness also requires T06–T09 or explicit scoped release decision.
6. Release verification: T11 after T03–T10.

T03 and T04 are independent once foundations settle. T08 and T09 do not need to wait for applications/payouts. Early mock contract cleanup occurs inside the replacing task, rather than leaving obsolete code until T10.

## Task specifications

### T01 — Lock unresolved contracts and representative fixtures

- **Module / business requirement:** Affiliate integration foundations; accurate implementation against official guide.
- **Current:** guide sufficient for paths and major behavior but incomplete detail/result DTOs; no effective-permission retrieval contract.
- **Changes:** resolve Q01–Q08 in QA; record redacted actual envelopes for Index/Show/create/settings/SMS/applications/payouts/generator/errors. Do not request unavailable repositories. Clarify activity exclusion and static-page grants.
- **Likely files:** existing audit questions/matrix; future colocated test fixtures under relevant modules (new paths to choose during implementation).
- **Endpoint dependency:** all E01–E19, roles/catalog and supported staff effective-grant source **not yet specified**.
- **Decision:** D01–D03. **Effort M; priority P1.**
- **Risks:** sample treated as complete spec; requesting production credentials.
- **Acceptance:** every consumed field's type/nullability recorded; per-endpoint permission matrix confirmed; settings representation and omitted response cases resolved; no invented routes.
- **Tests:** fixture provenance review; planned parser cases for envelope/type/null/identity/error.
- **DoD:** contracts reviewable, unresolved nonblocking questions explicitly deferred, required fixtures synthetic or sanitized, no application behavior changed.

### T02 — Shared transport, grants and error foundation

- **Module / business:** Affiliate data boundary and directly related staff auth/navigation; real staff access.
- **Current:** isolated client; auth has roles only; generic backend errors; DEV/mock gate.
- **Changes:** use $http, introduce confirmed grants source/capability policy and readiness gate, X-Locale, scoped message/422 policy, auth-boundary cache-write protection. No production flag enablement.
- **Files:** `src/modules/affiliates/api/affiliates.service.ts`, `config/affiliate-feature.ts`; `src/modules/auth/types/auth.types.ts`, `src/store/auth.ts` only as confirmed contract requires; routes/privateRoutes, dashboard-navigation, axios.helpers, apply-api-validation-errors and direct tests.
- **Endpoint dependency:** T01 grants contract, B/dashboard base; retain existing login.
- **Decision:** D01/D02/D04/D05/D07. **Depends T01; effort L; P1.**
- **Risks:** shared auth regression, duplicate notifications, stale grants or token leak.
- **Acceptance:** staff requests use one client, no manual token copy, unknown grants deny, S-only settings/P-only payouts handled,401/403 correct, rollout closed.
- **Tests:** shared HTTP/auth boundary/header, capability combinations, routes/nav/actions, errors-as-text, logout during mutation.
- **DoD:** focused tests/lint/types/format pass; directly affected shared consumers checked; no unrelated auth redesign or new persistence.

### T03 — Programme settings vertical migration

- **Module / business:** AFF-07 settings; configure actual programme.
- **Current:** old fields, partial PATCH/version, invalid constraints, slug text, no read-only/disable confirmation.
- **Changes:** full six-field PUT and GET metadata; correct bounds/precision; published page selector; permission-driven read-only; disable confirmation and terms-change consequences; remove version/conflict contract and mock notices in this slice.
- **Files:** Affiliate service/types/API/form schemas, settings utility/hooks/page/form/locales/tests; reuse Static Pages service/FormSelect, modify directly only if confirmed selector need.
- **Endpoint dependency:** E01/E02 and GET B/dashboard/pages; Q03/Q04.
- **Decision:** D03/D05/D06. **Depends T01/T02; effort L; P1.**
- **Risks:** stale full write, unavailable page permissions, empty first page hiding later published pages.
- **Acceptance:** all fields sent including unchanged; minimum0 valid; percentage max2 decimals; terms ID published; V-only no Save; cancel disable no request; dirty edits survive refetch.
- **Tests:** transport/body/parsing, numeric boundaries, selector pagination/error, read-only/confirmation, draft/422, EN/AR.
- **DoD:** real staging read/write validated when authorized, obsolete settings version paths gone, no claims of unsupported concurrency.

### T04 — Affiliate list, totals, creation and CSV

- **Module / business:** AFF-08; staff onboarding and financial overview.
- **Current:** minimal strict rows,15-page requests, no totals/export; wrong generator/create DTO and no SMS outcome.
- **Changes:** summary/result DTOs; source/order/balance columns and four meta.totals tiles; correct pagination policy; CSV same filters through blob GET; name-based generator preserving manual code; optional code, phone canonicalization/account_handle; SMS outcome.
- **Files:** service/types/API schema; list page/components/form/create drawer; useAffiliates/useCreateAffiliate/useAffiliateCodeSuggestion/query keys/locales/tests.
- **Endpoint dependency:** E03–E06; Q02/Q05/export headers.
- **Decision:** D01/D03–D06. **Depends T01/T02; effort L; P1.**
- **Risks:** sums based on loaded pages, duplicate create after failed SMS, object URL leak, stale suggestions, unknown CSV filename/encoding.
- **Acceptance:** server totals preserved; filters identical on CSV; safe download cleanup; no fake default balances; normalized phone and backend uniqueness; SMSfalse retains successful account and offers manual reset path.
- **Tests:** real summary/additive fields/meta, pagination/filters/export errors/download cleanup, Saudi inputs, optional/max code, stale suggestion,422/SMS, grants and RTL.
- **DoD:** list/create/export all on shared transport, obsolete suggestion shape removed, relevant baseline tests replaced.

### T05 — Affiliate detail, profile and management actions

- **Module / business:** AFF-09; inspect performance and manage account safely.
- **Current:** profile-only detail and PATCH, no reasons, queued-only reset, undocumented activity.
- **Changes:** full detail model and period URL filters; masked bank/balances/orders/payouts/source/login/terms; sparse profile PUT; required status reasons; confirmed reset/SMS; remove/defer unsupported activity; data-safe cache reconciliation.
- **Files:** service/types/schemas, detail page/header/sections/profile/edit/action components, hooks/keys/locales/tests; activity files only per Q07.
- **Endpoint dependency:** E07–E11; Q05/Q06/Q07.
- **Decision:** D03/D04/D06. **Depends T01/T02/T04; effort L; P1.**
- **Risks:** rich detail erased by partial response, dated cache confusion, unsupported timeline, status races.
- **Acceptance:** dates reflected in query identity/request; backend amounts preserved; code immutable; sign-in email effect explained; reasons submitted; no credentials; no undocumented activity calls.
- **Tests:** full detail/nulls/dates/identity/404; profile dirty fields via PUT; reason lengths; SMS outcomes; cache in-flight/logout/range; linked application when route ready.
- **DoD:** all management operations migrated; mock actor/result/status contracts removed or explicitly excluded; UI ready for EN/AR 360 px verification.

### T06 — Application review workflow

- **Module / business:** AFF-12; review, approve and reject applications.
- **Current:** no TASK05B implementation found.
- **Changes:** new module sections within existing feature architecture: list/detail/decision dialogs, oldest-first pages/pending_count, customer/fields/followers/proposed code, unavailable suggestion explanation, selected-code approve/SMS, reject reason10–250,409 reconciliation; show decision metadata without invented history.
- **Files:** new Affiliate application service/types/schemas/hooks/keys/pages/components/tests (planned, not existing); routes/navigation/locales and detail cross-links.
- **Endpoint dependency:** E12–E15; Q02/Q05/Q07.
- **Decision:** D02–D06. **Depends T01/T02/T04; effort L; P1.**
- **Risks:** stale pending count, duplicate decisions, account success conflated with SMS failure.
- **Acceptance:** backend order retained; no unsupported search/sort invented; terminal actions absent; rejection10–250;409 refreshes record/list once and never retries decision; approve code collision maps inline.
- **Tests:** statuses/pages/counter, nested customer/nulls, suggested availability, bounds/422, parallel-admin409, approval links/caches/SMS and grants.
- **DoD:** staff can complete both decisions on verified contract, automated coverage and EN/AR states, no fake customer identity or full-history claim.

### T07 — Protected payout processing

- **Module / business:** AFF-10; pay/reject pending withdrawals.
- **Current:** absent.
- **Changes:** P-gated oldest-first list/filter/detail, full IBAN restricted to payout surface, balance/warning, reference3–50/date-not-future default today, reject10–250, pending-only transition and409 reconciliation.
- **Files:** new payout service/types/schemas/hooks/keys/pages/components/tests in feature architecture; routes/navigation/locales; dependent detail/list cache integration.
- **Endpoint dependency:** E16–E19; Q08 and permission matrix.
- **Decision:** D02–D04/D06. **Depends T01/T02/T05; effort L; P1.**
- **Risks:** sensitive bank data retained/logged, payment duplicated, incorrect timezone date, auto-blocking advisory warning.
- **Acceptance:** only authorized staff fetch sensitive records; no IBAN in URL/persistence/telemetry; warning shown and staff decides; nonfuture date; paid/rejected cannot be decided again; balances authoritative.
- **Tests:** no-access/P-only; warning/negative/refund; reference/date/reason boundaries; duplicate click/409/network ambiguity; cache/logout; EN/AR 360 px.
- **DoD:** staging role/decision checks and data-handling review complete; no optimistic monetary mutations, no email-delivery claim.

### T08 — Order attribution integration

- **Module / business:** Orders; visible Affiliate commission context.
- **Current:** order DTO/mapper/layout drop affiliate.
- **Changes:** optional schema/type/map/render, amount/status/adjustment, permission-aware detail link and accessible base/rate/discount explanation; preserve snapshots through status updates.
- **Files:** `src/modules/orders/schemas/order.schema.ts`, `types/order.types.ts`, `utils/order-normalizers.ts`, `components/OrderDetailsLayout.tsx`, new narrow section, locales and existing __tests__.
- **Endpoint dependency:** GET B/dashboard/orders/{id}; complete status responses if reused.
- **Decision:** D03/D04. **Depends T01/T02; detail link rollout depends T05; effort M; P1.**
- **Risks:** old orders rejected, gift/loyalty lost, hover-only inaccessible data.
- **Acceptance:** absent/null block safe; attributed order shows exact backend amounts and negative adjustment; keyboard/touch accessible details; no calculation.
- **Tests:** old/attributed/null/malformed responses, cancelled/approved refund snapshots, link denial, existing gift/loyalty/status regressions.
- **DoD:** directly affected Orders tests pass; no unrelated order workflow change.

### T09 — Coupon collision regression

- **Module / business:** Coupons; resolve cross-namespace code conflicts.
- **Current:** correct field alias with generic error message.
- **Changes:** scoped backend code-message display for both create/edit; retain existing serializer/draft behavior; no preflight availability requests.
- **Files:** CouponForm, relevant mutation/error policy if needed, CouponsPage tests; optional explicitly scoped shared-helper extension from T02.
- **Endpoint dependency:** POST/PUT B/dashboard/coupons;422 errors.code.
- **Decision:** D05. **Depends T02; effort S; P2.**
- **Risks:** global error-policy regression or stale draft discard.
- **Acceptance:** specific collision visible inline, editable draft retained, correction resubmits once, normal coupon validation preserved.
- **Tests:** create/edit422, case collision from backend, escaped content, network fallback and duplicate submits.
- **DoD:** focused Coupon/shared-helper tests pass; no new collision service or client authority.

### T10 — Final runtime mock removal

- **Module / business:** Affiliate/config/docs; eliminate retired development transport.
- **Current:** R01–R19 inventory in mock-removal plan.
- **Changes:** remove last mock client/env/types/assertion/scenario paths and stale setup/locale references, adapt feature gate, retain synthetic tests. Preserve unrelated user changes.
- **Files:** inventory R01–R19; no unrelated mock fixtures.
- **Endpoint dependency:** all enabled endpoints already replaced, not a new API.
- **Decision:** D07. **Depends T03/T04/T05; effort M; P1.**
- **Risks:** dangling imports, hidden production gate, deleting useful test coverage.
- **Acceptance:** no runtime mock imports/credentials/host or obsolete wire shapes; unsupported routes remain closed; documented Laravel setup.
- **Tests:** production gate/bundle scan, focused suite, config/route/locale regressions.
- **DoD:** removal evidence and retained/replaced-test inventory reviewed; feature rollback plan disables rather than uses fake data.

### T11 — Production readiness verification

- **Module / business:** all enabled staff Affiliate surfaces and direct shared consumers.
- **Current:** source audit only; no Laravel runtime validation.
- **Changes:** run scoped checks, authorized staging API/browser scenarios, permission/financial/SMS/concurrency checks; broader build/regression justified for release; resolve failures in scope.
- **Files:** test additions needed by above tasks; release evidence/checklist in audit docs; no fabricated success report.
- **Endpoint dependency:** enabled E01–E19 plus order/coupon and permitted staff-grant source.
- **Decision:** D01–D08. **Depends T03–T10; effort L; P1.**
- **Risks:** mock pass mistaken for integration pass, live financial writes without a controlled staging scenario.
- **Acceptance:** QA matrix passed or explicit release-blocking exception; no unknown sensitive access path; AR/EN keyboard/mobile verified; full route readiness set deliberately.
- **Tests:** contract/service/UI/cache/auth tests, direct authorized staging API checks, browser responsive/accessibility, production bundle/build.
- **DoD:** evidence-backed GO decision, no unresolved enabled-workflow P1, exact commands/results/limitations recorded.

## Immediate implementation priorities

**First T01, then T02, then T03.** Do not start by deleting mock config or editing only API_BASE. T04 can begin after foundations while T03 is reviewed. Questions on undocumented activity or the external panel should not block unrelated documented slices, but effective permissions block production exposure.

