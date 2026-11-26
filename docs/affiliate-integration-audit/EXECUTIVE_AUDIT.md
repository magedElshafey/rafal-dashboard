# EPIC-11 executive integration audit

Audit date: 2026-11-26. Verdict: **NOT READY — NO-GO for production Affiliate rollout.**

The Dashboard has reusable Affiliate management UI, but its entire Affiliate service uses a development-only transport and obsolete contracts. Changing the base URL alone will fail. Migrate the data boundary and affected forms together, keep incomplete routes unavailable, and retire each mock dependency only after its replacement passes focused verification.

## Scope and authority

Only `D:/personal-projects/rafal-dashboard` was inspected. The supplied `AFFILIATE_INTEGRATION_GUIDE.pdf`, Backend version 2026-11-24, is authoritative; references below use its physical PDF pages and numbered sections. All 11 pages were text-extracted and read before contract comparison. Some Arabic copy and symbols were missing from extraction; exact Arabic copy needs visual verification. The English API fields, methods, constraints and lifecycle text were readable. A second PDF-reader attempt was unavailable because no Desktop Commander device was online.

No Website, Laravel Backend, standalone Mock API, Flutter or Affiliate Panel source was inspected. The separate business-story DOCX mentioned by the guide was not supplied. Absence in those repositories is not asserted. PDF §6 local test-data instructions were treated as reference, not permission to retrieve generated passwords or execute writes.

Source hierarchy: official guide; actual Dashboard Laravel conventions; available requirements; source/tests; obsolete mock material. Existing integration notes are secondary to current source: notably Static Pages now serializes filters despite an older note saying page-only.

## Evidence-based coverage

Counts describe accessible code, not runtime backend verification.

| Inventory | Count | Meaning |
| --- | ---: | --- |
| Affiliate page components / registered conditional routes | 3 / 3 | List, detail, settings; `src/routes/privateRoutes/index.tsx:99` |
| Requested Affiliate functional capabilities | 13 | Eight have mock-backed UI; five application capabilities have no implementation |
| Mock-backed requested capabilities | 8 | List, create, details, edit, suspend/reactivate, reset password, Affiliate history, settings |
| Missing requested application capabilities | 5 | List, detail, approve, reject, application history; history API itself is undocumented |
| Official dedicated staff Affiliate operations | 19 | Settings 2, Affiliate management 9, applications 4, payouts 4 |
| Official operations with existing mock counterparts | 10 | Settings 2 and management 8; all require migration |
| Official dedicated operations with no service counterpart | 9 | Export 1, applications 4, payouts 4 |
| Dedicated operations integrated through real Laravel client | 0 / 19 | No fully compatible Affiliate operation demonstrated |
| Extra mock-only operation | 1 | Affiliate activity GET, not documented in guide |
| Affiliate test files | 7 | Service 1, gate 1, schemas 2, pages 3; not a Laravel contract certification |
| Cross-module integration surfaces | 2 | Orders attribution missing; Coupons collision field routing partial |

AFF-10's four staff payout operations are missing in this repository. The Affiliate Panel is an external architecture workstream, not included in the 13-capability or 19-operation denominators.

## Top ten contract gaps

| Gap | Severity | Impact and evidence |
| --- | --- | --- |
| G01 Transport/auth ownership | P1 | Mock Bearer scenario replaces real staff auth; `src/modules/affiliates/api/affiliates.service.ts:74`; guide pp.1,7 §4 |
| G02 Effective authorization | P1 | No granular grants in session, no action/route guards; `src/modules/auth/types/auth.types.ts:1`, `src/modules/affiliates/components/AffiliateDetailsHeader.tsx:48`; p.7 §4 |
| G04–G07 Settings | P1 | PATCH/version/slug and invalid numeric ranges conflict with full PUT/page ID; `src/modules/affiliates/api/affiliates.service.ts:98`, `schemas/affiliate-settings.schema.ts:14`; pp.7–8 §4.1 |
| G08 Listing and finances | P1 | Strict profile-shaped row parser rejects real list; totals/source/balances missing; `schemas/affiliate-api.schema.ts:5`, `api/affiliates.service.ts:114`; p.8 §4.2 |
| G09 Creation/generation | P1 | Wrong field names, missing Saudi normalization, required optional code, wrong generator URL and response; `components/AffiliateForm.tsx:102`, `api/affiliates.service.ts:130`; p.8 §4.2 |
| G10 Detail/profile | P1 | Missing financial detail/date filters/source linkage; PATCH instead of PUT; `api/affiliates.service.ts:136`, `components/AffiliateDetailsSections.tsx:37`; p.9 §4.2 |
| G11–G12 Management/SMS | P1 | No reasons; reset expects queued result instead of SMS result; `api/affiliates.service.ts:148`, `components/AffiliateActionDialog.tsx:36`; p.9 §4.2 |
| G14 Applications | P1 | Entire review lifecycle absent, including pending count and concurrent-decision handling; route inventory `src/routes/routes.ts:42`; p.9 §4.3 |
| G15 Payouts | P1 | No payment processing, warning or protected IBAN UI; route/service inventory; pp.9–10 §4.4 |
| G16–G17 Order/coupon integration | P1 / P2 | Attribution dropped; coupon collision message replaced with generic validation; `src/modules/orders/schemas/order.schema.ts:112`, `src/utils/apply-api-validation-errors.ts:30`; p.10 §§4.5–4.6 |

P1 means release blocking for the corresponding production workflow; P2 means material usability/regression gap. No P0 active production incident was established: production Affiliate routes are currently disabled by the development gate.

## Reuse and migration recommendation

Keep the module architecture, shared HTTP client, TanStack Query, URL filters, forms/drawers, responsive data layout, query-state handling, skeletons, confirmation primitives and bilingual locale structure. Keep synthetic unit/integration fixtures, updating their contracts.

Replace the feature Axios client with `$http`; do not introduce another client or a universal legacy compatibility layer. Split list/detail/mutation DTOs, preserve backend money strings, and render server messages as escaped plain text. Existing shared validation intentionally replaces server copy, so use an explicit narrowly scoped policy rather than silently changing every form.

Do not infer grants from the permissions catalog or role names. Obtain a supported effective-permissions contract; keep affected production capabilities closed until it is available. Retain the existing staff session owner, without adding feature token persistence. Existing auth persists its session in localStorage (`src/store/auth.ts:70`); the migration must not duplicate or expand that behavior.

## First three implementation tasks

1. **T01 — Confirm the small unresolved contract surface and fixtures.** Effective staff permissions, response DTOs/nullable fields, static-page access and undocumented activity.
2. **T02 — Establish shared transport, message handling and permission boundaries.** Depends on T01; no production exposure or mock fallback.
3. **T03 — Migrate programme settings as the first complete vertical slice.** Depends on T01/T02; full PUT, bounds, published page selector, read-only policy and disable confirmation.

Then migrate list/create/detail/actions (T04–T05), applications (T06), payouts (T07), order attribution (T08), coupon collision feedback (T09), retire leftovers (T10), and verify release (T11). T08/T09 can proceed independently once their foundation contracts are settled. See the roadmap for exact dependencies.

## Production release conditions

Real staff authentication and effective permissions; all enabled features on documented Laravel contracts; authoritative balances/SMS/conflict behavior; no runtime mock credentials/transport; no full IBAN outside authorized payout surfaces; EN/AR, RTL, keyboard and 360 px validation; staging contract and denial checks. Mock unit tests alone cannot satisfy release conditions.

## Safety and limitations

Only the six Markdown files in this directory are authorized changes. The pre-existing `.env.example` edit changes `VITE_API_BASE_URL` to `https://api.rafal.shop/api/v1`; it is preserved. No application source, tests, dependencies, credentials, commits or external application data were changed. No Laravel requests or browser E2E/visual checks were performed. Final command evidence and release checks are recorded in [BACKEND_QUESTIONS_AND_QA.md](BACKEND_QUESTIONS_AND_QA.md).

