# Active dependencies and release blockers

## Dashboard Integration & QA reconciliation - 2026-11-26

Evidence source: user-reported live Laravel results, not new requests by this agent. Local mocks establish frontend behavior only; no browser integration run has been completed.

| Area | Current frontend / verified evidence | Remaining acceptance |
| --- | --- | --- |
| Settings | Nullable GET/form; positive published ID required for six-field PUT. Null PUT rejected; unchanged read-back and published ID 9 PUT/persistence VERIFIED_AGAINST_LIVE_API. String Settings title and localized Static Pages titles supported. | Browser selection/pagination and settings-only staff page access; no initial-only null inference. |
| List | URL pagination/search/status and meta.totals supported; live success VERIFIED_AGAINST_LIVE_API. Decimal strings retained without financial arithmetic. | Browser filter/back navigation and populated page rendering. |
| Generate Code, Details, Date Range, Edit, Suspend, Reactivate | Successful requests VERIFIED_AGAINST_LIVE_API. Reactivate requires a reason; omitted body returned HTTP 422. Existing service/dialog require nonblank reason and send trimmed text. Active status retains the returned reactivation reason. | Local fix preserves status_reason in detail schema/model/adapter and renders it for active and suspended status. Browser reconciliation still pending. |
| Nullable details | Null application_id/login timestamps and empty orders/payouts accepted. Unused nullable user_id and bank fields are excluded from the UI model. | Populated history row semantics and history pagination still unverified; date-range success does not prove these. |
| Create | BACKEND_BUG_VERIFIED: record persisted, then serialization failed with Attempt to read property "value" on null in AffiliateDetailResource.php:39. | Backend must fix serialization and provide a safely reconciled successful create response. No blind replay. Local create retry remains false; network/5xx/malformed-response errors show an unconfirmed-result warning, preserve the open draft and disable resubmission in the mounted drawer, including reopen. Route reload is not proof of noncreation; reconcile the record with Backend before creating again. |
| CSV | Endpoint success VERIFIED_AGAINST_LIVE_API. Existing Blob anchor download, sanitized header filename and affiliates.csv fallback are tested locally, including URL cleanup. | Real browser file save, actual CSV MIME and cross-origin Content-Disposition exposure remain browser checks. |
| Applications / Payouts | Only empty-list responses VERIFIED_AGAINST_LIVE_API. | Populated lists/details, decisions and financial transitions remain unverified. No financial or SMS mutations authorized in this task. |
| Authorization | Unknown grants fail closed; verified grants are in-memory and token-bound. Changes cancel/evict Affiliate queries and fence obsolete mutation results. All four release flags remain false. | Authoritative staff permissions hydration is absent; positive real-browser access remains blocked pending verified source integration and separate release authorization. |


2026-11-26. This section supersedes earlier B02/B03 classifications. No Backend message has been sent.

## BACKEND_DEPENDENCY: authoritative effective staff permissions

The existing session exposes identity and role names, not verified effective permission names. Backend must identify the supported current-staff source and its response field. No catalog, role-name or Super Admin inference is used. The frontend now has an in-memory, token-bound setVerifiedPermissions integration seam, distinct unknown (null) and verified-empty ([]) states, and exact per-action permission checks across page boundaries, navigation, queries, actions and services. Login/storage restoration/logout reset grants to unknown. There is deliberately no production caller until the source is verified.

## RELEASE_BLOCKER: activation and live acceptance

All four existing release/settings/financial readiness gates remain false. Production requires integrating the verified permission source, executing authorized live smoke tests and release approval. These are not evidence that ordinary Laravel endpoints are missing or defective. Role-based read-only tests must verify the prepared action mapping; no implicit grant inheritance is implemented.

Settings now follow the verified read/write distinction below. The published-ID 9 PUT and read-back are VERIFIED_AGAINST_LIVE_API. The reported numeric minimum payout, generator and routine detail requests now have live-success evidence; untested history shapes remain tracked in document 11. They are not requests for Backend clarification before a safe GET. Financial transitions use acknowledgments followed by authoritative reads, with no optimistic balances or automatic retries. A consumed or ambiguous payout decision remains locked across closure and session changes; a successful GET still returning pending does not prove the earlier mutation failed. Live payout mutation testing still requires a separately approved disposable payout with no external financial effect.

## Verified settings read/write distinction - 2026-11-26

Evidence supplied by the user from a live Laravel smoke test; no new live requests were made by the agent in this alignment task. Exact HTTP status numbers were not supplied.

| Observation | Classification |
| --- | --- |
| GET /api/v1/dashboard/affiliate-settings succeeded with terms_page_id: null and terms_page: null | VERIFIED_AGAINST_LIVE_API |
| Full six-field PUT with terms_page_id: null returned success: false and terms_page_id validation errors | REJECTED_BY_LIVE_VALIDATION |
| Follow-up GET confirmed every original setting unchanged | VERIFIED_AGAINST_LIVE_API |
| Full six-field PUT with published Static Page ID 9 succeeded | VERIFIED_AGAINST_LIVE_API |
| Subsequent GET confirmed ID 9 persisted and all other settings unchanged; enabled and applications_enabled remain false | VERIFIED_AGAINST_LIVE_API |
| Settings terms_page.title is a plain string; Static Pages list titles are localized { ar, en } objects | VERIFIED_AGAINST_LIVE_API |

The initial observed settings were enabled=false, applications_enabled=false, customer_discount_percent=10, commission_percent=10, min_payout=100, terms_page_id=null and terms_page=null. The rejected PUT message and errors.terms_page_id[0] both read: "يرجى اختيار صفحة الشروط".

This proves null is readable, the tested null write is rejected, and the tested published-ID 9 write succeeds and persists. It does not prove null is an initial-only state or establish a lifecycle rule. The existing parser and selector support both the verified plain-string Settings title and localized Static Pages titles. Read/form types remain nullable; the write type requires a number, with positive safe-integer guards and a published-page check before form submission. All six PUT fields, selected-page metadata, pagination, 422 feedback and draft preservation remain supported. Authorization and release gates are unchanged.

Backend dependencies are the effective-permission source and the verified create-response serialization bug described above. The null PUT rejection is handled by frontend validation, not a request to make Laravel nullable on writes. Other untested workflows retain their previous live-verification limitations.

<details>
<summary>Historical record before this frontend completion task; superseded by the active status above</summary>

# Active Laravel integration blockers

2026-11-26. Messages are **READY TO SEND — NOT SENT**. No communication channel has been authorized. Existing approved guide extraction is used; no fresh PDF verification or live Backend requests.

## B01 — Effective staff permissions

- Task: T02 and protected Affiliate feature exposure.
- Endpoint: existing staff `/dashboard/auth/login`; effective-grants source unknown.
- Missing: authoritative effective permission names, envelope, Super Admin semantics, refresh/revocation policy.
- Impact: role names and assignable catalog cannot authorize protected reads/writes. All Affiliate routes remain closed, with no development bypass.
- Implemented: shared staff transport, auth-epoch fences, exact-name policy with all 16 synthetic grant subsets tested, and service/query/route closure. Effective-grants hydration and runtime per-action policy remain unfinished; changing a flag is not a valid activation procedure.
- Required response: sanitized source/envelope and refresh contract, plus exact middleware for list/detail/create/generator/export/application reads.
- Status: OPEN.

**Urgent Backend message:** Please provide the supported current-staff effective-grants source and sanitized response, including refresh/revocation behavior and exact permission requirements for Affiliate list/detail/create/generate/export and application reads. We cannot expose these routes using roles or the permissions catalog. Integration code and synthetic tests will proceed with protected routes closed.

## B02 — Settings special cases and page authorization (narrowed)

- Date: 2026-11-26. Task: settings activation; GET/PUT /dashboard/affiliate-settings and GET /dashboard/pages.
- Evidence: the guide documents the six-field PUT, numeric min_payout, positive terms_page_id and published-page requirement. The user's nullable-settings request additionally requires explicit null support. Both cases are implemented and covered by local synthetic tests; Laravel acceptance of null remains unverified.
- Missing: live confirmation that Laravel accepts and persists explicit null, and authoritative access to published-page options for settings-only staff. Additional decimal precision beyond the documented numeric case remains a nonblocking question.
- Impact: the UI must not silently clear a page or use ID 0; settings-only staff must not be given guessed page access.
- Implemented: complete six-field PUT mapping; numeric zero/range cases, positive published-page selection, explicit null/clear, dirty drafts/discard and disable confirmation. Non-null unpublished selections cannot save; null needs no page lookup result. GET/form/PUT preserve null without substituting ID 0, undefined or a default. Null-page 422 errors stay inline with the cleared draft preserved. No Mock version field.
- Disabled: all protected production access remains closed by B01. The settings write readiness gate also stays false pending authorization/page-access and controlled staging verification, not because the entire documented settings contract is unknown.
- Required response: exact settings-only page-access policy; null/clear semantics for that optional special case. The numeric non-null request does not require reconfirmation.
- Status: OPEN, narrowed to special cases/access; ordinary request mapping implemented awaiting Laravel verification.

**Backend message — READY TO SEND — NOT SENT:** Numeric minimum payout and nullable terms-page PUT are implemented in the frontend. Please confirm published-page lookup access for staff holding only affiliates.settings.manage, and verify that Laravel accepts and persists terms_page_id: null. Non-null unpublished selections remain prohibited. No live 422 was observed, so no Backend validation defect is claimed. Staff grant hydration and controlled verification remain prerequisites to activation.

### Nullable settings live smoke evidence — 2026-11-26

- Controlled testing was explicitly authorized, conditional on the existing programme being disabled.
- No authenticated staff session was accessible through the available tools; no supplied authentication environment or local browser debugging listener was found on ports 9222/9223.
- Initial GET: not executed; original response and enabled state unavailable. PUT and verification GET: not executed. No HTTP status, response or Laravel validation error was observed.
- Restoration: not required because this task made no live requests or changes. No restoration GET was executed.
- Laravel null acceptance remains unknown. Repeat the authorized GET / conditional PUT / GET / restore / GET sequence once an authenticated session is available. If Laravel rejects null, capture its 422, verify unchanged settings, and align Backend validation/persistence with the requested nullable contract.

## B03 — Complete detail and decision results

- Tasks: T05 full financial detail and T07 sensitive payout decisions.
- Endpoints: Affiliate detail and payout detail/paid/reject.
- Missing: exact nested financial/detail DTOs, financial decision result envelope and transfer-date timezone.
- Impact: unsafe to invent balances, replace rich detail with partial data, expose unverified banking fields, or report financial success from an unknown result.
- Implemented: minimal Affiliate detail, profile/status writes parsing the common success envelope then refetching, actual reset SMS outcome, application approval using documented Affiliate ID/SMS and rejection using the success message with 409 reconciliation. Payout list/minimal detail and balance warning are implemented. Paid/reject forms, request schemas, service methods, duplicate locks, draft preservation and 409/cache reconciliation are now prepared behind the independent closed isAffiliatePayoutDecisionReady gate. Date defaults to the browser-local calendar day in this closed UI; no timezone conversion is applied to the date-only payload. Full IBAN stays within the closed payout workflow, never persisted or logged.
- Disabled: live financial decision activation and unknown financial/bank detail sections; all protected exposure also blocked by B01. Application decisions no longer have an independent DTO blocker, but await B01 and Laravel verification.
- Required response: sanitized representative envelopes, including null/empty, SMS false and already-decided conflicts; synthetic IBAN only.
- Status: OPEN.

**Backend message:** Please provide complete Affiliate financial/detail and payout detail/paid/rejected envelopes with synthetic banking data, plus the timezone governing date-only transferred_at and its future-date rule. Live financial decisions and unknown financial sections remain disabled. Prepared methods validate only the common acknowledgment and refetch authoritative state; they do not claim a completed payment or update balances. Activation additionally requires verified financial result semantics and controlled staging acceptance. Application decisions now consume the documented minimal result and await authorized staging verification and B01. No timed-out decision is automatically replayed.

</details>
