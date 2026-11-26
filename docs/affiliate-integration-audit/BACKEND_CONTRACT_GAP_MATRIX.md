# Backend contract comparison and gap matrix

Current status (2026-11-26): this matrix is a historical pre-integration comparison. Active frontend implementation, local verification, prepared assumptions and the sole confirmed Backend dependency are tracked in documents 10, 11 and 12. Document 07 contains the unexecuted authorized-session smoke checklist. Do not treat old INCOMPATIBLE/MISSING labels below as current defects or live evidence.

Authority: Affiliate Programme Frontend Integration Guide, backend 2026-11-24. Physical pages: p.1 common conventions/boundaries; pp.2–4 storefront; pp.4–7 Affiliate Panel; pp.7–10 staff; p.10 commission lifecycle; pp.10–11 local test recipe. All pages reviewed; external surfaces inform boundaries only.

## Reading conventions

`B` = configured Laravel origin plus `/api/v1`. Thus `B/dashboard/affiliates` means the full path `/api/v1/dashboard/affiliates`; the guide's `http://rafal.test` is an example host, not a deployment requirement. Every staff operation below uses the existing **staff Bearer token**, Accept JSON, optional **X-Locale: ar|en** (default ar). JSON envelopes are `{success,message,data,meta?}`, errors `{success:false,message,errors}`; CSV is a file response. Render supplied message as escaped text. No password is returned.

Common failures: 401 for invalid/wrong token realm and 403 for insufficient grants. Structured validation is 422 where applicable; 409 is specifically documented for already-decided applications/payouts. The guide does not enumerate every endpoint's 404, 429, validation field, success status or mutation response. Do not infer a universal error-code contract.

Permissions: **V** = affiliates.view; **M** = affiliates.manage; **S** = affiliates.settings.manage; **P** = affiliates.payouts.process. Settings V-or-S reads/S writes, management actions M, application decisions M and payouts P are explicit. V for list/detail and M for create/generate are intended UI policies inferred from §4's roles, but exact per-endpoint middleware and grant implication must be confirmed. Export permission is not explicitly assigned. Do not assume M implies V.

Code evidence abbreviations, all relative to `src/modules/affiliates/`:

- **AS** `api/affiliates.service.ts`
- **AZ** `schemas/affiliate-api.schema.ts`
- **AT** `types/affiliate.types.ts`
- **AF** `components/AffiliateForm.tsx`
- **SF** `components/AffiliateSettingsForm.tsx`
- **SS** `schemas/affiliate-settings.schema.ts`
- **ST** `api/affiliates.service.test.ts`

## Complete dedicated staff endpoint comparison

The 19 rows below are the denominator used for coverage. No row has verified real Laravel runtime integration.

| ID | Official full URL and method | Authz | Request, response and rules | Existing source, UI and tests | Status |
| --- | --- | --- | --- | --- | --- |
| E01 | GET B/dashboard/affiliate-settings | V or S | No body. Six settings plus terms_page {id,slug,title,is_published}; pp.7–8 §4.1 | AS:92 maps obsolete names/version/slug; AZ:83 rejects official shape; settings page test:74 | INCOMPATIBLE |
| E02 | PUT B/dashboard/affiliate-settings | S | All six fields required; see field table. Programme off stops codes/join link but permits sign-in/payment; changing page forces reacceptance; p.8 §4.1 | AS:98 PATCH with changed fields/version; SF:150 conflict workflow; ST:174 asserts old contract | INCOMPATIBLE |
| E03 | GET B/dashboard/affiliates?search=&status=&page=&per_page=25 | V policy; confirm | status active/suspended. Rows id,name,code,phone,email,source,status,orders_count,pending,approved_unpaid,paid,created_at; meta pagination + totals; p.8 §4.2. Sorting unspecified | AS:104 requests 15; AZ:5 requires profile fields; extra:null discards totals; list has no financial tiles; ST:58 | INCOMPATIBLE |
| E04 | GET B/dashboard/affiliates/export?search=&status= | Confirm | CSV file, same search/status filters as list; columns/encoding/filename unspecified; p.8 §4.2 | No service/UI/test counterpart; AS:91 inventory | MISSING |
| E05 | GET B/dashboard/affiliates/generate-code?name= | M policy; confirm | Name-based prefill; guide does not show response DTO or guarantee reservation; p.8 §4.2 | AS:187 calls /code-suggestion without name; AZ:37 requires reserved:false; ST:96 | INCOMPATIBLE |
| E06 | POST B/dashboard/affiliates | M policy; confirm | name,phone,email,platform,account_handle,optional code. 201 data {affiliate,sms_sent,sms_message}; p.8 §4.2 | AS:130 sends mobile/username; parses data as affiliate directly; AF:102 trims phone; ST:78; page test:219 | INCOMPATIBLE |
| E07 | GET B/dashboard/affiliates/{id}?from=YYYY-MM-DD&to=YYYY-MM-DD | V policy; confirm | Profile, source,application_id,last_login_at,terms_accepted_at,masked bank,balances,period figures,orders including adjustment_amount,payouts. Exact nesting/pagination unspecified; p.9 §4.2 | AS:136 no dates, returns minimal profile; detail sections:37; detail page test:91 | INCOMPATIBLE |
| E08 | PUT B/dashboard/affiliates/{id} | M | Optional name,phone,email,platform,account_handle; email changes sign-in. Exact response not shown; p.9 §4.2 | AS:142 PATCH mobile/username; edit drawer:38 dirty payload; ST:104; detail test:144 | INCOMPATIBLE |
| E09 | POST B/dashboard/affiliates/{id}/suspend | M | {reason}, 10–250 characters; active→suspended, code stops checkout. Exact response/conflict status unspecified; p.9 §4.2 | AS:148 sends no body, expects full old profile; action dialog:36 no input; ST:117; detail test:240 | INCOMPATIBLE |
| E10 | POST B/dashboard/affiliates/{id}/reactivate | M | {reason}; suspended→active. Required reason documented; exact length is not restated for this endpoint; p.9 §4.2 | AS:154 no body; same dialog/tests; old status-code conflict logic | INCOMPATIBLE |
| E11 | POST B/dashboard/affiliates/{id}/reset-password | M | No body; confirm first; data {sms_sent,sms_message}; p.9 §4.2. Never show password | AS:160 expects affiliate_id/delivery_status queued/channel/requires_password_change/requested_at; dialog already confirms; ST:117; detail test:290 | INCOMPATIBLE |
| E12 | GET B/dashboard/affiliate-applications?status=&page= | V policy; confirm | pending/approved/rejected, oldest first, meta.pending_count. Row id,name,phone,platform,followers_range,status,created_at. Page size/meta details unspecified; p.9 §4.3 | No route/service/DTO/UI/tests; routes.ts:42 and AS inventory | MISSING |
| E13 | GET B/dashboard/affiliate-applications/{id} | V policy; confirm | customer {id,name,phone,account_email,customer_since,orders_count}; application fields,rejection_reason,decided_by,decided_at,proposed_code,suggested_code_unavailable,suggested_code_message; p.9 §4.3 | No implementation. Decision metadata is not a full activity endpoint | MISSING |
| E14 | POST B/dashboard/affiliate-applications/{id}/approve | M | {code}; pending→approved; data {affiliate,sms_sent,sms_message}; proposed code editable, unavailable suggestion feedback; 409 already decided, reload affected record; p.9 §4.3 | No implementation/tests. No legacy approval shape to preserve | MISSING |
| E15 | POST B/dashboard/affiliate-applications/{id}/reject | M | {reason}, 10–250; pending→rejected, SMS to customer and join-page reason; 409 already decided; exact success data unspecified; p.9 §4.3 | No implementation/tests | MISSING |
| E16 | GET B/dashboard/affiliate-payouts?status=&per_page= | P | pending/paid/rejected, oldest first; rows include affiliate {id,name,code} and full iban; other fields/pagination need samples; p.9 §4.4 | No route/service/UI/tests | MISSING |
| E17 | GET B/dashboard/affiliate-payouts/{id} | P | {payout,affiliate_available_balance,warning}; display non-null warning after refunds; staff decide pay/reject; p.9 §4.4 | No implementation/tests; never infer auto-block from warning | MISSING |
| E18 | POST B/dashboard/affiliate-payouts/{id}/paid | P | {transfer_reference:3–50 chars,transferred_at:YYYY-MM-DD}; date not future, UI defaults today; pending→paid, 409 if decided; pp.9–10 §4.4 | No implementation/tests; no client balance arithmetic | MISSING |
| E19 | POST B/dashboard/affiliate-payouts/{id}/reject | P | {reason:10–250}; pending→rejected, amount returns to balance, 409 if decided; p.10 §4.4 | No implementation/tests | MISSING |

The existing E01–E03/E05–E11 paths are mock-backed counterparts, not matching end-to-end integrations. Guide p.1 says no suspension/payment emails yet; SMS is real for welcome/reset/application rejection. Do not invent notification receipts or resend creation/approval to retry SMS.

### Cross-module operations

| Official operation | Required change | Current evidence / tests | Classification |
| --- | --- | --- | --- |
| GET B/dashboard/orders/{id} | Optional affiliate {id,name,code,discount:{percent,amount},commission:{base,rate,amount,status,adjustment_amount}}. Link to Affiliate; expose discount/base/rate accessibly; p.10 §4.5 | `src/modules/orders/api/orders.service.ts:45` real HTTP; `schemas/order.schema.ts:112` and `utils/order-normalizers.ts:36` omit block; layout:15 has no section; existing detail/gift/loyalty tests must remain | PARTIAL |
| POST B/dashboard/coupons | 422 errors.code[0] for Affiliate collision, p.10 §4.6 | `src/modules/coupons/api/coupons.service.ts:123`, `components/CouponForm.tsx:136` route field correctly; `src/utils/apply-api-validation-errors.ts:30` substitutes generic text; collision-specific tests absent | PARTIAL |
| PUT B/dashboard/coupons/{id} | Same collision rule; existing complete coupon write remains unchanged | Same service:132, same form; existing draft-failure test `pages/CouponsPage.test.tsx:260` does not verify collision text | PARTIAL |

Existing order/coupon permissions remain their current backend policy; the guide does not redefine them. Confirm Affiliate detail link behavior for staff allowed to read Orders but not Affiliates.

### Settings field matrix

| Official PUT field | Type/rule in guide | Current mock equivalent | Exact migration |
| --- | --- | --- | --- |
| enabled | boolean; all-fields PUT | program_enabled / programEnabled | Rename at boundary; confirm off before submit |
| customer_discount_percent | number 1–50, ≤2 decimals | customer_discount_percentage, 0–100, arbitrary decimals | Correct Yup/input bounds and precision |
| commission_percent | number 0.5–50, ≤2 decimals | affiliate_commission_percentage, 0–100, arbitrary decimals | Separate lower bound; do not reuse one 0–100 validator |
| min_payout | numeric example; 0–10,000 | minimum_payout_amount decimal string; >0, no cap | Permit zero/cap 10,000; confirm GET representation/decimal precision ambiguity |
| applications_enabled | boolean | applications_enabled | Name compatible; send even unchanged |
| terms_page_id | published static page ID | terms_page_reference slug string | ID selector, published pages only; confirm null/clear semantics |
| terms_page (GET only) | {id,slug,title,is_published} | absent | Read-only selected record metadata; not a PUT field |
| version/updated_at | not documented | required in GET/PATCH and form | Remove requirements and conflict protocol; no fabricated concurrency |

Guide p.1 says money strings with two decimals, but p.8 settings uses numeric min_payout. Treat this as a narrow unresolved representation point, not permission to preserve the old schema.

### Creation and application fields

Canonical phone is +9665 followed by eight digits, unique among affiliates. Email is unique among affiliates. Code is optional on staff creation, generated when empty; 4–20 English letters/digits, unique against both Affiliate and Coupon codes. Existing uppercase UI normalization is reusable; availability remains backend-authoritative.

The guide explicitly lists application platform values instagram/tiktok/snapchat/x/youtube/website/other and followers_range lt_1k/1k_10k/10k_50k/50k_100k/gt_100k (p.4 §2.5). Application fields also include email, account_handle (2–200), other_accounts (up to 3, each up to 200), promotion_plan (up to 500), suggested_code and terms_accepted. These inform staff detail display; do not assume every applicant-form constraint also applies to staff creation without confirmation. Current staff free-text platform, username max100 and name/email maxima are provisional rules, not documented staff guarantees.

## Detailed gap register

Severity scale: P0 active critical incident; P1 production workflow/release blocker; P2 material correctness/usability gap; P3 nonblocking improvement. No P0 was proven. Each record supplies story/module, requirement/current difference, category/status, affected code, impact, implementation/dependencies and verification. Endpoint tables above provide method/URL/auth/request/response/error references without repeating them in every record.

### G01 — Real staff transport and token ownership

- Story/module: AFF-07/08/09/10/12, Affiliate service. P1; category transport/authentication; **MOCK_ONLY**.
- Requirement: guide pp.1,7 §4, staff Bearer and B/dashboard paths. Current AS:74–88 constructs isolated Axios with environment scenario token; config/affiliate-feature.ts:8 requires DEV.
- Impact: none of the 19 dedicated operations is real-integrated; environment URL swap cannot supply staff lifecycle/headers.
- Required: shared $http service methods, no copied token access, no mock fallback; maintain abort and notification ownership.
- Dependencies: T01 contract decisions, T02. Verify exact composed URL, current staff Authorization, 401 isolation, no production mock host/header.

### G02 — Effective permissions and rollout boundaries

- Story/module: all staff Affiliate workflows plus Roles/navigation. P1; category authorization; **BACKEND_DEPENDENCY**.
- Requirement: p.7 §4, four grants; settings read V-or-S. Current `src/modules/auth/types/auth.types.ts:1` has roles only; `src/modules/auth/guards/RequireAuth.tsx:7` auth only; `pages/AffiliatesPage.tsx:40` and `components/AffiliateDetailsHeader.tsx:48` always show mutations.
- Impact: frontend cannot hide/disable/protect exact capabilities; catalog is not authorization. APIs still must enforce 403.
- Required: confirmed grants snapshot, deny unknown, route/nav/action/query policy, separate payout permission; production gate independent of mocks.
- Dependencies: Q01/Q02, T02. Verify none/V/M/S/P combinations, revocation, direct URL and API attempts, Super Admin semantics.

### G03 — Locale and backend feedback

- Story/module: all Affiliate plus coupon collision. P1; category response/error/localization; **INCOMPATIBLE**.
- Requirement: p.1 messages as-is and X-Locale; p.10 §4.6 collision reason. Current `src/config/axios.helpers.ts:8` lacks X-Locale; `src/utils/error/api-error.helpers.ts:1` returns fallback only; validation helper:30 discards field messages.
- Impact: staff lose precise collision/SMS/rejection/validation explanations.
- Required: bounded server-envelope text handling scoped to these contracts, escaped rendering, localized fallback for transport/malformed responses; avoid duplicate global/local toasts.
- Dependencies: T02/T09; header change affects shared consumers. Verify EN/AR header, server field aliases, malicious markup rendered as text, no raw error/config/token exposure.

### G04 — Full settings contract

- Story/module: AFF-07. P1; category method/DTO/concurrency; **INCOMPATIBLE**.
- Requirement: E01/E02, pp.7–8 §4.1. AS:45,58,98 and AT:55 require old names/version; `utils/affiliate-settings.ts:28` builds partial writes.
- Impact: read parse failure, rejected writes and fictitious lost-update guarantees.
- Required: six-field PUT/new GET mapping; remove version conflict state and updated_at requirement; preserve dirty draft on background refresh without promising concurrency.
- Dependencies: T03, Q03; verify unchanged fields included, no version/PATCH, canonical success baseline, failures preserve draft.

### G05 — Settings numeric validation

- Story/module: AFF-07. P1; category validation; **INCOMPATIBLE**.
- Requirement: p.8 §4.1 bounds/precision. SS:14,33 and SF:319 accept 0–100/arbitrary percentages, reject minimum zero and omit cap.
- Impact: invalid values pass locally; valid zero blocked.
- Required: field-specific bounds, percentage precision, confirmed min-payout representation; remove obsolete tests `schemas/affiliate-settings.schema.test.ts:24`.
- Dependencies: T03/Q03. Verify exact endpoints, just-outside values, third decimal, min 0 and 10,000.

### G06 — Published terms selection

- Story/module: AFF-07/Static Pages. P1; category relationship/validation; **MISSING**.
- Requirement: p.8 §4.1 published terms_page_id; all affiliates reaccept after different page. SF:362 accepts arbitrary slug; no static-page hook.
- Impact: no valid foreign key or publication selection; consequences hidden.
- Required: reuse paginated staticPagesService/FormSelect, labels/ID mapping, selected metadata, publication checks and terms-change explanation.
- Dependencies: Q04, T03; `src/modules/static-pages/api/static-pages.service.ts:76`, `utils/static-page-filters.ts:30`.
- Verify options across pages, unpublished rejection, current selection outside loaded page, 403/empty/retry, no duplicate option requests.

### G07 — Settings read-only and programme disable UX

- Story/module: AFF-07. P1; category business rule/permission; **MISSING**.
- Requirement: p.8 §4.1 disable all fields/hide Save for read-only; confirm programme off with checkout/join/sign-in/payment effects.
- Current SF:225 disables only pending/conflict; save at249 always exists; no disable confirmation.
- Impact: unauthorized mutation affordance and unconfirmed programme shutdown.
- Required: S-derived form policy, transition-aware confirmation before PUT, translated effects and terms warning.
- Dependencies: T02/T03. Verify V-only and S-only; cancel sends nothing; one confirmed PUT; programme-off does not hide permitted payouts.

### G08 — Index DTO and financial summary

- Story/module: AFF-08. P1; category response/pagination/financial UI; **INCOMPATIBLE**.
- Requirement: E03, p.8 §4.2 source/order counts/three balances/four totals tiles. AZ:5 strict profile parser, AS:24 per_page15 and AS:125 extra:null; `components/AffiliatesList.tsx:21` has contact/social/status columns only.
- Impact: real rows fail, financial overview absent. Page size15 is a mismatch, not proof backend forbids it; legal per_page range unspecified.
- Required: separate summary DTO, preserve meta.totals, server pagination25 policy, source and monetary columns/tiles, no sums over loaded rows.
- Dependencies: T04/Q05. Verify decimal strings/negative balances, filtered totals semantics, pagination/empty/meta, no invented list sorting.

### G09 — Creation and code generation

- Story/module: AFF-08. P1; category request/response/validation; **INCOMPATIBLE**.
- Requirement: E05/E06 p.8 §4.2. AS:187 wrong URL/no name; AF:102 mobile trim/username, schema:26 requires code; AS:133 expects direct entity.
- Impact: validation failures and successful create misclassified as failure; SMS failure hidden.
- Required: canonical phone, account_handle, optional code, name-keyed generator query, selected-code draft protection, mutation result with affiliate/SMS.
- Dependencies: T04/Q05. Verify every accepted Saudi input canonicalizes, blank code omitted/accepted as agreed, uniqueness422, suggestion races, SMSfalse does not recreate affiliate.

### G10 — Detail and profile update

- Story/module: AFF-09. P1; category response/request/navigation/filters; **INCOMPATIBLE**.
- Requirement: E07/E08 p.9 §4.2. AS:136/142 ignores dates and PATCHes old fields; AT:3 lacks detail; sections:37 lacks balances/orders/payouts/source/bank/login/terms.
- Impact: staff cannot inspect commissions or provenance; profile changes rejected.
- Required: verified detail DTO, URL from/to and query keys, profile PUT, read-only code, application link conditional on source/ID/permission.
- Dependencies: Q05/T05/T06 for working application destination. Verify nulls/period changes/cache separation/profile email warning/negative adjustments; no optimistic commission math.

### G11 — Reasons and status transitions

- Story/module: AFF-09. P1; category mutation/business rule; **INCOMPATIBLE**.
- Requirement: E09/E10 p.9 §4.2. AS:148/154 and dialog:36 no body/input. `hooks/useAffiliateAction.ts:13` recognizes mock AFFILIATE_STATUS_CONFLICT only.
- Impact: real validation failure; missing auditable rationale.
- Required: reason form, suspend10–250; confirm reactivate bound; M gating; status-aware controls and authoritative reconciliation; no assumed mock error codes.
- Dependencies: Q06/T05. Verify lengths/empty reasons/duplicate clicks/403/state refresh; do not silently retry status mutation.

### G12 — Password reset and SMS outcome

- Story/module: AFF-08/09/12. P1; category side effects/response; **INCOMPATIBLE**.
- Requirement: pp.8–9 create/approve/reset SMS boolean/message, reset confirmation, no password. AS:160/AZ:66 require queued reset DTO; `hooks/useCreateAffiliate.ts:16` and action:40 show generic success.
- Impact: cannot distinguish account success from SMS failure.
- Required: preserve confirmation/security, render result; manual reset suggestion on failed welcome SMS without automatic action.
- Dependencies: T04–T06. Verify both SMS outcomes, success envelope text, no password fields/logging, no duplicate mutation retry.

### G13 — Affiliate and application activity

- Story/module: AFF-09/12. P2; category undocumented endpoint/actor; **BACKEND_DEPENDENCY**.
- Requirement: p.9 §§4.2–4.3 documents no full history endpoint; application has decided_by/decided_at/rejection_reason.
- Current AS:173 fetches /activity, AZ:44/AT:42 hardcode mock_staff/development-staff; detail page:59 mounts it unconditionally. Application history absent.
- Impact: undocumented request fails after cutover; fake identity is not staff audit evidence.
- Required: defer full timeline pending contract, remove runtime call at Laravel cutover if unavailable; show only supplied decision metadata for applications. Keep whitelisted renderer only if real events can support it.
- Dependencies: Q07/T05/T06/T10. Verify no activity GET absent agreement; never fabricate actor or imply metadata is complete audit trail.

### G14 — Application review lifecycle

- Story/module: AFF-12. P1; category missing workflow; **MISSING**.
- Requirement: E12–E15 p.9 §4.3 plus applicant fields p.4. No application route/service/type/page/test in inspected tree; `src/routes/privateRoutes/index.tsx:99` lists only existing three pages.
- Impact: staff cannot review or decide applications.
- Required: list/detail, oldest-first backend ordering, URL status/page, pending_count, customer context/followers/proposed code, code availability message, approve/reject10–250, SMS result, 409 scoped refresh and terminal actions hidden.
- Dependencies: T01/T02/T04 DTO reuse, T06. Verify two-admin conflict, code collision422, pending count authoritative, approval creates linkable Affiliate, no duplicate decision.

### G15 — Payout processing

- Story/module: AFF-10. P1; category missing financial/sensitive workflow; **MISSING**.
- Requirement: E16–E19 pp.9–10 §4.4. No payout route/service/UI found in full tracked Affiliate reference search.
- Impact: no staff payout completion/rejection workflow.
- Required: P-gated list/detail/actions, warning, date/reference/reason validation, pending-only decisions409, scoped balance refresh. Full IBAN limited to protected payout surface; no URL/localStorage/log/analytics persistence.
- Dependencies: T02/T05 financial models/Q08, T07. Verify permission combinations, negative balance warning remains visible, pay decision not automatically blocked by warning, race handling, terminal buttons absent, cache cleared at auth boundary.

### G16 — Order attribution and refunds

- Story/module: AFF-09, Orders. P1; category cross-module DTO/presentation; **MISSING** for attribution (existing order operation PARTIAL).
- Requirement: p.10 §§4.5/5, backend snapshot and adjustment. `src/modules/orders/schemas/order.schema.ts:112`, mapper:36, layout:15 omit affiliate.
- Impact: staff cannot trace discount/commission/refund change.
- Required: optional attributed block through schema/type/mapper/layout; link, amount/status, accessible discount/base/rate and negative adjustment; no recalculation.
- Dependencies: T08, detail route availability/permission. Verify absent/null/present, malformed field, negative/zero adjustments, existing gift/loyalty/status mutation preservation.

### G17 — Coupon collision feedback

- Story/module: AFF-08, Coupons. P2; category error-contract; **PARTIAL**.
- Requirement: p.10 §4.6, 422 code error. CouponForm:136 maps field but shared helper:30 replaces message.
- Impact: field flagged but staff not told collision is with Affiliate.
- Required: scoped server-copy display for create and edit; no availability preflight or local uniqueness authority.
- Dependencies: T02 message policy/T09. Verify422 code text, retained draft, correction/resubmit, normal coupon duplicate behavior and generic network safety.

### G18 — Safe cache, financial and date modeling

- Story/module: AFF-08/09/10/12. P1; category data consistency; **PARTIAL**.
- Requirement: pp.8–10 authoritative totals/balances/decisions. Keys:9 lacks period; `hooks/useUpdateAffiliate.ts:17` would replace rich detail with mutation profile; action hooks lack auth-boundary epoch fences.
- Impact: stale periods, lost financial fields, late mutation repopulation after logout.
- Required: distinct DTOs/keys; cancel older reads before verified replacements, invalidate exact variants when response incomplete, fence cache writers using existing epoch; preserve signed money/date strings.
- Dependencies: T02 and each slice. Verify logout during mutation, range races, loaded pages/no duplicates, no fabricated balance arithmetic, no global invalidation.

### G19 — Runtime mock retirement and test replacement

- Story/module: all. P1; category rollout/config/test contract; **MOCK_ONLY**.
- Requirement: target real Laravel; guide p.7 §4. Current env.ts:5/vite-env.d.ts:4/.env.example:2, feature gate, README:19, SF:260 and EN/AR notices expose mock contract.
- Impact: production remains unavailable or accidentally retains fake auth; old green tests could conceal incompatibility.
- Required: replace before remove; preserve meaningful isolated fixtures, replace scenario-token/PATCH/version/bodyless-status assertions, remove stale runtime notices/contracts only after cutovers.
- Dependencies: T10 after enabled slices; T11. Verify tracked runtime references, bundle/string audit, production gate combinations, seven test files adapted rather than indiscriminately deleted.

### G20 — Affiliate Panel boundary

- Story/module: AFF-01–04, external panel. P1 architectural dependency for panel rollout, not a Dashboard code defect; category authentication boundary; **UNVERIFIED** external implementation.
- Requirement: pp.1,4–7 §3 own token/session/routes, password→terms onboarding, 360 px; cross-token401.
- Current: staff login/session only; no panel found. No evidence Dashboard currently conflates staff and Affiliate login.
- Required: product ownership/deployment decision; separate storage/client if later co-located. Do not build panel in this audit or treat staff routes as a shortcut.
- Dependencies: Q10 external workstream. Verify cross-realm denials in authorized staging; inspect external implementation only when available.

## Compatible foundations and deliberate unknowns

Status **COMPATIBLE** applies narrowly to reusable mechanisms: URL search/status serialization (`utils/affiliate-filters.ts:8`), confirmation primitives, draft preservation, shared HTTP service pattern, no frontend commission calculation, and current active/suspended domain values. It does not certify any dedicated endpoint.

**UNVERIFIED**: deployed schemas, SMS delivery behavior, effective grants, guide's omitted DTO details, header locale behavior and permitted page sizes. **BACKEND_DEPENDENCY**: effective-permission retrieval and full activity contracts. No unavailable external code is labeled MISSING.

