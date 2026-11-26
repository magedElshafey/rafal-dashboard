# Current Dashboard architecture and Affiliate inventory

Audit date: 2026-11-26. Paths and line anchors describe the inspected working tree. This is source inspection, not proof of deployed behavior.

## Stack and ownership

`package.json` declares React 19, Vite 6, TypeScript 5.7, React Router 6, TanStack Query 5, Axios, Zustand, React Hook Form, Yup, Zod, i18next, Tailwind 4 and Radix components. Vitest 3, RTL, user-event and jsdom are configured in `vite.config.ts:18` and `src/test/setup.ts:1`. Yarn is the declared package manager.

`src/routes/privateRoutes/index.tsx:58` wraps DashboardShell in RequireAuth. Affiliate routes are lazy-loaded at lines 47–49 and conditionally registered at 99–105. `src/routes/routes.ts:42` declares list/settings/detail. `src/modules/dashboard/layout/dashboard-navigation.ts:28` imports the same development gate for its Affiliate links. No application or payout route/service/page was found by scoped filename/content search and the tracked Affiliate-reference inventory.

The established flow is page → query/mutation hook → feature service → shared HTTP → Laravel. Affiliate currently follows the first three steps but substitutes an isolated Axios client.

## Shared Laravel integration

| Concern | Actual implementation | Migration implication |
| --- | --- | --- |
| Client | `src/utils/http.ts:1`, `src/utils/create-http-client.ts:40`, `src/config/axios.ts:9` | Reuse single Axios owner; JSON PUT and blob GET already supported |
| API prefix | `src/config/env.ts:4`; service paths use `/dashboard/...` | With base ending `/api/v1`, append `/dashboard` once; PDF's local hostname is illustrative |
| Headers | `src/config/axios.helpers.ts:8` | Accept and staff Bearer supplied; sends Default-Language/Accept-Language, not guide's X-Locale |
| Login | `src/modules/auth/service/login.service.ts:4` | Real multipart POST `/dashboard/auth/login`; no Affiliate login |
| Session | `src/store/auth.ts:18,32,70,92` | Zustand, persisted identity/token/role names; no effective permission names |
| 401/403 | `src/config/axios.ts:27,43` | Current-token 401 clears cache/session; default 403 navigates to /403; local forbidden opt-out exists |
| Query cache | `src/lib/react-query/query-client.ts:4,36` | Central QueryClient and auth-boundary clear/epoch; mutations retry zero |
| Form validation | `src/utils/apply-api-validation-errors.ts:17` | Aliases support snake_case/indexed errors but display generic translated message |
| API feedback | `src/utils/error/api-error.helpers.ts:1`, `src/config/axios.helpers.ts:20` | Backend messages are discarded; migration needs scoped server-copy policy |

The shared client is appropriate for staff Affiliate operations. The current auth docs report no staff /me or revoke endpoint; that is existing documentation, not a newly verified backend fact. Do not invent either endpoint. The guide's Affiliate-specific logout/password/terms endpoints must never be routed through staff auth.

## Authorization versus role administration

`src/modules/roles/api/permissions.service.ts:5` reads grouped `GET /dashboard/permissions`, using shared HTTP with local 403 handling. `components/RolePermissionSelector.tsx:16` operates on exact permission names and dynamic groups. Existing role writes serialize permission-name arrays; no hardcoded Affiliate group is needed if the backend catalog includes it.

This is an assignable catalog, not the current employee's effective grants. `AuthAdmin` contains `roles: string[]` only (`src/modules/auth/types/auth.types.ts:1`); `RequireAuth.tsx:7` checks authentication only. Affiliate create/edit/action/settings controls are ungated. Guide p.7 §4 introduces four exact names: `affiliates.view`, `affiliates.manage`, `affiliates.settings.manage`, `affiliates.payouts.process`. Only Super Admin receives them by default, according to the guide; do not turn an unverified role-name comparison into frontend authorization.

## Affiliate feature inventory

Root: `src/modules/affiliates/`.

| Capability | Current flow and evidence | Classification |
| --- | --- | --- |
| Listing | `pages/AffiliatesPage.tsx:25` → useAffiliates → service.list; infinite pages, URL search/status | MOCK_ONLY; responsive shell reusable |
| Creation | `components/AffiliateCreateDrawer.tsx:15` → form → useCreateAffiliate → POST | MOCK_ONLY; request/result incompatible |
| Code suggestion | Drawer-open query; `hooks/useAffiliateCodeSuggestion.ts:6`; fixed suggestion key | MOCK_ONLY; name-based generator replaces it |
| Detail | `pages/AffiliateDetailPage.tsx:40` → useAffiliate → show; independent activity query | MOCK_ONLY; profile-only |
| Profile edit | `components/AffiliateEditDrawer.tsx:38` sends dirty fields; profile form retains draft | MOCK_ONLY; PUT and DTO adaptation needed |
| Suspend/reactivate | `components/AffiliateActionDialog.tsx:36` confirms then sends no-body action | MOCK_ONLY; reason inputs absent |
| Reset password | Same dialog; expects queued metadata | MOCK_ONLY; real SMS result absent |
| Affiliate history | `components/AffiliateActivity.tsx:40` renders whitelisted changes and generic actor | MOCK_ONLY; API not in guide |
| Settings | `pages/AffiliateSettingsPage.tsx:10` → form → versioned PATCH | MOCK_ONLY; full PUT and page selection needed |
| Application list | No implementation found | MISSING |
| Application detail | No implementation found | MISSING |
| Application approval | No implementation found | MISSING |
| Application rejection | No implementation found | MISSING |
| Application history | No implementation found; guide has decision metadata, no timeline endpoint | BACKEND_DEPENDENCY for full history |
| Payout staff workflow | No implementation found | MISSING |
| Affiliate Panel | No separate login/routes/session found | External workstream; DEFER |

The first 14 rows before payouts/panel represent 13 requested capabilities plus code suggestion as an additional implementation detail; the executive count combines suspend/reactivate and excludes the extra suggestion row.

No TASK 05B application work was found in the accessible working tree. No runtime hardcoded Affiliate/application record arrays or in-repository seed generator were found. Current fake runtime behavior comes from the external mock transport and simulated audit identity, not local fixture arrays.

## DTO and form mismatches

`api/affiliates.service.ts:28` maps one strict profile DTO into every Affiliate read/write. Real Index has source/order counts/money but omits some profile fields; detail has a larger, distinct shape. `schemas/affiliate-api.schema.ts:5` requires mobile/username/platform/updated_at and rejects extra keys, so real Index cannot simply be pointed at this parser.

Settings require program_enabled, percentage names, decimal-string minimum, terms slug, version and timestamp (`schemas/affiliate-api.schema.ts:83`). Form validation uses Yup, API validation Zod; keep both existing roles rather than converting forms solely for uniformity.

Creation/profile normalize mobile only with trim (`components/AffiliateForm.tsx:102`, `AffiliateProfileForm.tsx:54`), although the schema accepts multiple Saudi forms. This relies on mock-side normalization; Laravel requires canonical phone. Code input uppercases and limits 4–20 but wrongly requires a value.

## Cache and state flow

`queries/affiliates.keys.ts:4` contains lists keyed by search/status, details by ID, activity by ID, settings and a constant suggestion key. There are no date-range keys, application keys, payout keys or financial aggregates.

Create invalidates lists; update writes detail then invalidates lists/activity; status actions write detail and invalidate lists/activity; reset invalidates activity only. Settings replace singleton data. These are narrow and reusable patterns, but the richer Laravel detail must not be overwritten with a partial mutation's Affiliate object. Remove undocumented activity refreshes; update/invalidate only data actually affected by each authoritative result.

List filters already use QueryProvider/URL state (`pages/AffiliatesPage.tsx:27,134`, `utils/affiliate-filters.ts:8`). Server pagination uses the shared infinite-query hook and consumes returned meta, but requests 15 instead of the guide's 25 example/default. Query defaults retry three times; permission/validation failures should not repeat three requests.

## Shared UI and localization

Reuse `DashboardPageHeader`, `DashboardCard`, `DashboardStatCard`, `ResponsiveDataLayout`, `QueryStateBoundary`, `EntityFormDrawer`, AlertDialog, FormInput/FormSelect/FormTextArea and existing skeleton primitives. Inspected `FormSelect.tsx:13` already supports pagination/retry and value serialization, suitable for page IDs without a new selector primitive. Stat cards accept a ReactNode value.

`src/lang/resources.ts:59,94,128` merges Affiliate EN/AR resources. Existing cards use bidi isolation, LTR phone/code/email and semantic tables/cards. Tests cover some AR/RTL behavior; 360 px, keyboard focus and visual layout remain unverified. Existing settings locale copy references mock behavior, proposed rules, a slug, 0–100 percentages and unconfirmed commission basis; all must be adapted.

## Cross-module implementation

- **Orders:** real shared HTTP in `src/modules/orders/api/orders.service.ts:45`. Zod detail schema at `schemas/order.schema.ts:112`, mapper at `utils/order-normalizers.ts:36`, layout at `components/OrderDetailsLayout.tsx:15` have no affiliate block. Unknown Zod object keys are stripped, so adding UI alone is insufficient. Existing gift/loyalty/history must survive the extension.
- **Financial presentation:** `src/modules/orders/utils/order-presentation.ts:29` formats decimal strings with BigInt integer grouping, not floating arithmetic. Test signed values including -0.50 before narrow shared reuse: BigInt('-0') loses the sign. Do not copy financial calculations into Affiliate UI.
- **Coupons:** real POST/PUT in `src/modules/coupons/api/coupons.service.ts:123,132`. `components/CouponForm.tsx:136` aliases code errors correctly, but shared helper discards specific backend text. Existing error/draft tests at `pages/CouponsPage.test.tsx:260` cover generic failure, not Affiliate-collision copy.
- **Static Pages:** real `GET /dashboard/pages` at `src/modules/static-pages/api/static-pages.service.ts:76`; domain has id/isPublished/localized title. Current `utils/static-page-filters.ts:30` serializes is_published/search/sorting despite stale page-only documentation. Verify backend support and permissions; otherwise paginate through results and filter published options without misreporting an empty page as the end.
- **General Settings:** `src/modules/settings/api/settings.service.ts:85` uses singleton shared HTTP with partial PUT serialization. Reuse structure only: Affiliate settings explicitly require all six fields.
- **Role management:** retain dynamic catalog and name-array writes; verify actual new grants appear without hardcoding them.

## Existing automated coverage

Seven Affiliate test files were inspected. Service tests explicitly assert isolated mock auth (`api/affiliates.service.test.ts:46`), no-body status writes (117), obsolete generator (96), PATCH (104) and versioned settings (174). Schema tests explicitly accept 0/100 and three decimal percentages and reject zero minimum (`schemas/affiliate-settings.schema.test.ts:24`).

Page tests cover listing/loading/error/empty/create/duplicate-submit/manual-code retention/RTL; detail invalid ID/404/edit draft/conflict/action/reset/history; settings loading/validation/dirty preservation/version conflict/retry/discard/RTL. Preserve meaningful behavior, replace obsolete contract assertions. No application/payout or attribution coverage was found. Test execution outcome is recorded in the QA document, separately from this inventory.

