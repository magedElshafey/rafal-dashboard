# Mock retirement and test preservation plan

This is a removal plan only. No production or test code was deleted or changed. The Laravel guide dated 2026-11-24 replaces provisional mock contracts; replacements must exist before dependent working UI is switched.

## Search scope and result

Searched Affiliate source/tests/locales/README, environment declarations/example, routes, navigation, locale registration and relevant documentation. A tracked-repository `git grep -l -i -E 'affiliate|mock-staff|development-staff'` inventory checked for consumers outside the module; targeted content searches covered mock URLs/tokens, mock_staff, development-staff, version/status conflict codes, localhost/4100, fixtures/seeds/demo, application/payout endpoints and TASK 05B. Ignored private environment files and real credentials were not printed or inventoried.

There is one runtime Affiliate mock Axios instance and two mock environment settings. No local runtime Affiliate/application fixture array, seed script, fake customer login, application transport or payout transport was found. Synthetic identities and records occur in isolated test files. The runtime fake staff identity is encoded in the activity DTO/schema and generic actor presentation. The external mock server's records and seed behavior cannot be audited here.

Classification: **REMOVE** obsolete after replacement; **REPLACE** with confirmed Laravel equivalent; **ADAPT** retain useful structure with new contract; **KEEP** compatible mechanism; **DEFER** unresolved dependency. Each inventory row specifies consumers, replacement, dependency/order, regression risk and verification.

## Runtime dependency inventory

Paths without a src prefix are relative to `src/modules/affiliates/`.

| ID / classification | File and location | Current consumers | Replacement and removal dependency | Risk and verification |
| --- | --- | --- | --- | --- |
| R01 REPLACE | `api/affiliates.service.ts:74–88` createAffiliateMockClient/affiliateHttp/assert | All eleven service methods (ten official counterparts plus activity) | T02 shared $http; each vertical slice switched with its DTOs; delete factory after last supported consumer cutover | Wrong session/prefix; assert only shared staff transport, no direct storage read, cancellation and401 |
| R02 REMOVE | `src/config/env.ts:5–6` | affiliate-feature.ts | Delete after R01/R05 no longer read config | Other env unaffected; type/lint/build checks |
| R03 REMOVE | `src/vite-env.d.ts:4–5` | Type declarations for two mock variables | Remove with R02 | Compile catches dangling references |
| R04 REMOVE | `.env.example:2–3` | Development setup instructions/config | Remove after R01; preserve user's pre-existing line1 API base change | No accidental environment reset; tracked diff and deployment config review |
| R05 REPLACE | `config/affiliate-feature.ts:3–9` | service assertion, private routes, dashboard navigation, gate tests | Explicit readiness gate independent of mock URL/token plus real permission checks, T02/T10 | Premature exposure or inaccessible approved feature; gate matrix in production/dev |
| R06 ADAPT | `src/routes/privateRoutes/index.tsx:7,99`, `src/modules/dashboard/layout/dashboard-navigation.ts:28,54` | Dashboard deep links/sidebar | Preserve existing routes behind readiness/permissions; add app/payout routes only when slices ready | Nav/route disagreement; direct URL, hide/deny/no-request tests |
| R07 ADAPT | `api/affiliates.service.ts:28–72,92–145`, `schemas/affiliate-api.schema.ts:5,83`, `types/affiliate.types.ts:3,55` | List/detail/create/edit/settings hooks and views | Separate real summary/detail/result/settings DTOs; narrow camelCase mapping, T03–T05 | Strict old parser rejects valid JSON; representative fixtures and malformed response tests |
| R08 REMOVE | `utils/affiliate-settings.ts:28` version/dirty-only payload; `hooks/useUpdateAffiliateSettings.ts:11`; `components/AffiliateSettingsForm.tsx:33,150,197` | Settings save, baseline and conflict panel | Six-field PUT, real baseline/draft policy, T03 | Removal loses draft protection; preserve dirty/refetch/failed-save tests, remove fabricated optimistic lock |
| R09 ADAPT | `schemas/affiliate-settings.schema.ts:14,33`, `components/AffiliateSettingsForm.tsx:319,362` | Settings inputs/validation | Official bounds and published-page selector, T03 | Zero wrongly rejected, unpublished page accepted; boundary/publication tests |
| R10 REPLACE | `api/affiliates.service.ts:187`, `hooks/useAffiliateCodeSuggestion.ts:6`, `queries/affiliates.keys.ts:13`, `types/affiliate.types.ts:69` | Create drawer and AffiliateCodeField | GET generate-code with name, agreed result shape, name-aware key; no reserved:false assumption, T04 | Delayed suggestion overwrites draft; stale-name/manual-code tests |
| R11 ADAPT | `components/AffiliateForm.tsx:102`, `AffiliateProfileForm.tsx:54`, `schemas/affiliate.schema.ts:16` | Create/edit forms | phone canonicalization, account_handle aliases, optional create code, T04/T05 | Accepted local number rejected remotely; transport and422 field tests |
| R12 REPLACE | `api/affiliates.service.ts:148–170`, `schemas/affiliate-api.schema.ts:66`, `types/affiliate.types.ts:48` | Status/reset hooks/dialogs | Required reason writes, SMS result model, T05 | Wrong status/SMS claims; reason bounds, duplicate-click, SMSfalse tests |
| R13 REMOVE | `hooks/useAffiliateAction.ts:13` AFFILIATE_STATUS_CONFLICT | Dialog close/error reconciliation | Documented HTTP409 handling where specified; management status behavior per confirmed contract, T05 | Generic409 must not be ignored or retried automatically |
| R14 DEFER / REMOVE at cutover if unsupported | `api/affiliates.service.ts:173`, `hooks/useAffiliateActivity.ts:6`, `queries/affiliates.keys.ts:10`, `pages/AffiliateDetailPage.tsx:59` | Activity timeline and mutation invalidations | Obtain real history API, or stop mounting/requesting it; no invented endpoint, T05/Q07 | Extra failing request and false audit trail; assert no /activity calls when unsupported |
| R15 REMOVE / ADAPT renderer only if real contract exists | `schemas/affiliate-api.schema.ts:44`, `types/affiliate.types.ts:34–45`, `components/AffiliateActivity.tsx:12,79` | Activity display | Remove mock_staff/development-staff contract; real actor metadata only | Fake employee attribution; tests exclude secrets/raw JSON and fabricated identity |
| R16 REMOVE / ADAPT remaining text | `components/AffiliateSettingsForm.tsx:260`, `locale/en.json:140–187`, `locale/ar.json:146` and corresponding settings/activity/reset keys | Settings warning/help, reset result and actor labels | Real programme consequences/numeric constraints/page selector/SMS feedback; remove proposed/mock-specific claims, T03–T05/T10 | Stale labels contradict real effects; EN/AR key parity and text assertions |
| R17 REPLACE | `README.md:19–56` | Developer setup/contract guidance | Laravel setup, four permissions, guide reference, tested limits and feature rollout, T10 | Old machine paths/provisional contract treated as authority; no instructions to start mock |
| R18 KEEP / ADAPT | `src/lang/resources.ts:59,94,128`, `src/modules/dashboard/locale/en.json:25`, matching AR | Locale merge/navigation | Keep module namespace, add app/payout labels; remove only obsolete keys | Missing translations/RTL; locale parity tests |
| R19 KEEP | `utils/affiliate-filters.ts:8`, status badge, skeletons, query/error/empty shared primitives | Existing pages | Reuse structure with real DTOs; extend URL filters/periods where documented | Duplicate state/request regressions; focused list/draft/UI checks |

R07 includes the old required mobile/username/updated_at fields, flat create response, obsolete settings names, slug/version and rejection of additive fields. No compatibility adapter should keep these alive as a second accepted production wire format. Domain camelCase is acceptable; obsolete semantics are not.

## Synthetic test fixtures are not runtime fake data

Keep `vi.mock`, `vi.spyOn`, controlled fake timers/observers and deterministic records inside isolated tests. They must describe the real contract. Names such as Noura/Sara and example.test addresses are test inputs, not a runtime identity mechanism. Do not remove unrelated Roles/Orders fixtures.

| Test file | Keep | Replace/remove obsolete assertions | Replacement coverage |
| --- | --- | --- | --- |
| `api/affiliates.service.test.ts:1` | Service boundaries, mapping, cancellation/error propagation | Isolated scenario token at46; per_page15 fixture assumption at58; flat create at78; /code-suggestion + reserved at96; PATCH at104; no-body suspend/reactivate at117; queued reset; fake activity; settings version at174 | Shared staff client/header/prefix, separate Index/Show/results, complete settings PUT, profile PUT, canonical phone, reasons, real SMS |
| `config/affiliate-feature.test.ts:3` | Explicit hidden/not-ready behavior | DEV+two-mock-vars as permanent rollout policy | Readiness flag plus permissions; prod-ready route available, incomplete route hidden |
| `schemas/affiliate.schema.test.ts:25` | Invalid email/phone/code and supported phone-input tests | Required code and provisional staff field limits where unsupported | Optional code/4–20 normalization, canonical phone serializer, backend422 authoritative |
| `schemas/affiliate-settings.schema.test.ts:23` | Boundary-driven tests | 0/100 percentage acceptance, 12.345 acceptance, zero-min rejection, slug grammar | Discount1–50, commission0.5–50, max2 decimals, minimum0–10,000, valid selected ID |
| `pages/AffiliatesPage.test.tsx:27,125` | Loading/error/empty/manual-code preservation/duplicate submit/RTL | Mock server normalization, old row fixtures and generic create-only response | Real rows/totals/source, SMS outcomes, name suggestion races, 422 collision, permissions |
| `pages/AffiliateDetailPage.test.tsx:23,79` | Invalid IDs/404, edit drafts, confirm, no credentials, independent sections | Fake actors at97/106; AFFILIATE_EMAIL_CONFLICT at178; AFFILIATE_STATUS_CONFLICT at266; queued feedback303; old PATCH payload | Full detail/periods, PUT/reasons, SMS, financial cache safety; real history only if documented |
| `pages/AffiliateSettingsPage.test.tsx:25,63` | Prefill/draft/errors/discard/RTL/duplicate lock | Version increment fixture, partial payload117, version conflict146/237 | Full PUT, readonly, disable confirmation, terms consequences/options, authoritative baseline |

The creation-page fixture at `pages/AffiliatesPage.test.tsx:247` also uses HTTP409 with `COUPON_CODE_CONFLICT`. Replace that obsolete fixture with the documented Laravel validation failure; retain the draft-preservation and duplicate-submit assertions. Together with `AFFILIATE_EMAIL_CONFLICT`, `AFFILIATE_STATUS_CONFLICT` and `AFFILIATE_SETTINGS_VERSION_CONFLICT`, these are provisional error-code assumptions, not Laravel requirements.

Add dedicated application, payout, order-attribution, coupon-collision and effective-permission tests as the workflows are implemented. These are planned tests, not files asserted to exist today.

## Safe removal order and checkpoints

1. **Record baseline and contracts (T01).** Preserve current uncommitted .env.example change. Resolve blocking DTO/auth ambiguities. Verify all UI consumers before deleting exports.
2. **Land foundations under closed rollout (T02).** Shared HTTP/message policy and effective permissions; no new fake transport. Existing mock branch remains only until its corresponding slice is ready; do not expose mixed production behavior.
3. **Replace settings atomically (T03).** Service/schema/form/test change together. Remove settings-specific version/slug/conflict flow in that same verified slice; retain existing mock client only for still-unmigrated modules.
4. **Replace management (T04/T05).** Switch list/create/generation/detail/edit/actions together with appropriate DTOs/keys. Remove activity calls if no real contract. Do not delete general UI merely because some activity data is deferred.
5. **Implement missing applications/payouts and cross-module integrations (T06–T09).** Use real infrastructure from their first implementation. They have no legacy mock implementation to delete.
6. **Remove remaining mock infrastructure (T10).** Once every enabled consumer is real, delete client/config/environment declarations/example settings and obsolete setup copy. Keep rollback as a disabled feature, not a return to fake staff credentials.
7. **Release verification (T11).** Static/runtime bundle searches, authorized staging smoke, role denials, money/SMS/conflicts, EN/AR accessibility. Enable only capabilities satisfying their acceptance gates.

Risks: removing the transport before views migrate breaks working development flows; keeping old strict schema silently blocks valid Laravel data; retaining mocked tests without new fixtures produces false confidence; reusing partial mutation data as full detail erases balances; automatic retries can duplicate irreversible decisions.

## Verification commands and expected interpretation

Future focused implementation commands:

- `node node_modules/vitest/vitest.mjs run src/modules/affiliates --maxWorkers=2 --minWorkers=1`
- Run directly affected Orders/Coupons/Roles/auth tests after shared changes.
- Changed-file Prettier and ESLint; targeted TypeScript project check.
- Search runtime source/config for VITE_AFFILIATE_MOCK, createAffiliateMockClient, mock_staff, development-staff, AFFILIATE_SETTINGS_VERSION_CONFLICT, AFFILIATE_STATUS_CONFLICT, code-suggestion, obsolete settings keys and queued-only result.
- Inspect matches by context. Historical audit documents and isolated synthetic fixtures are allowed; production imports/strings must not retain retired dependencies.
- Verify production build contains no mock host/scenario credentials. Broad build/tests are justified at final release and after shared infrastructure changes, not as routine audit work.

No removal is complete until its consumers use the replacement and relevant regressions pass. This audit's test attempt did not yield a passing baseline; see QA.

