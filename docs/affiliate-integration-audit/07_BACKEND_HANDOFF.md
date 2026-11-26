# Authorized-session manual smoke checklist

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


2026-11-26. Settings evidence has now been supplied by the user as classified below. Remaining checks are pending; the agent made no new live requests. Use the configured API base ending /api/v1 and the existing authenticated staff client/session. Do not put tokens in commands, saved collections, screenshots or reports. Do not open frontend gates merely to run transport checks. Preserve current settings privately in memory for possible restoration; publish only sanitized status/type observations.

## Practical browser QA sequence

1. On the current unchanged build, sign in normally. Verify Affiliate navigation/actions remain inaccessible with unknown effective grants and direct URLs send no Affiliate requests. Do not inject grants into storage/devtools or enable flags to bypass this blocker.
2. Backend supplies the authoritative effective-permission source/field; implement and test real hydration separately. Obtain separate release approval and an approved QA deployment before positive UI tests. Create remains blocked on the serialization fix; financial release stays closed.
3. With authorized staff accounts, check view/manage/settings permissions independently, forbidden responses, logout/session replacement and grant revocation. Check no old user/grant data survives. Record sanitized method/path/status only; never save tokens or customer/bank data.
4. Exercise list pagination, search/status URL filters, refresh and browser back/forward. Compare rows and totals to Network responses. Open an existing disposable affiliate; verify decimal strings, null placeholders, empty histories, active status reason and from/to behavior.
5. Exercise code generation without saving: edit name/manual code while a suggestion is pending, cancel/close, and verify no stale suggestion replaces the draft. Inspect Edit/Suspend/Reactivate dialogs and blank/whitespace reason blocking without executing a mutation in this QA phase. Later writes require explicit controlled-data authorization and must not trigger SMS.
6. Open Settings with the verified selected ID 9. Check string title metadata, localized page options, pagination, loading/error/retry and EN/AR RTL keyboard behavior. Use local response fixtures for initial null, invalid/unpublished selection and 422 draft-preservation checks; do not manufacture live rejected writes or activate the programme. A real write requires separately authorized test data.
7. Export a permitted filtered list. Inspect the saved CSV and filename in the browser. Confirm affiliates.csv when Content-Disposition is unavailable (local response fixture or approved QA CORS configuration). Verify no blank tab, duplicate download or object URL leak; keep downloaded customer data private.
8. Review Applications/Payouts empty states read-only. Do not infer populated-data or financial decision acceptance. Use local fixtures for errors and populated displays. No approve/reject/paid/reset-password/create operations that can cause SMS or financial effects.
9. Reproduce Create 5xx/network/malformed-response warning only with local fixtures: no automatic retry, draft remains, submit disabled after reopening. For the already persisted live record, reconcile by phone/email/code with Backend rather than recreating it. After Backend repair, successful Create/SMS acceptance requires a separate explicitly authorized disposable test.
10. Record browser/version, environment, locale, viewport, permission set, sanitized response shape and pass/fail for each step. Mark positive browser checks BLOCKED until prerequisites are fulfilled; unit tests and Postman success are not browser acceptance.

## Additional read-only API sequence

1. Confirm the approved environment and staff identity. Use the existing session's authentication headers and locale; never infer permissions from roles. Record timestamp, method, path, HTTP status and whether the expected shape passed, omitting names/emails/phones/bank data.
2. GET /dashboard/affiliate-settings. Check the common success envelope and all six fields, numeric/string min_payout and nullable terms_page_id. Do not mutate if this fails.
3. GET /dashboard/affiliates?page=1&per_page=25; then page=2 if meta.last_page allows. Repeat with search=<disposable-code> and status=active/suspended. Verify current_page, last_page, totals and exact decimal strings, empty results and filter-dependent totals.
4. GET /dashboard/affiliates/generate-code?name=Test. Verify data.code; do not create an account or assume reservation.
5. Using an ID returned by step 3, GET /dashboard/affiliates/{id}, then with from=2026-11-01&to=2026-11-26. Compare balances/profile/orders/payouts. Where metadata indicates further pages, try orders_page=2 and payouts_page=2 separately. Confirm row IDs/page metadata actually change; if not, adapt to the observed Laravel pagination names rather than treating the fixture assumption as verified.
6. GET /dashboard/affiliate-applications?page=1&status=pending and approved/rejected; request page=2 when present. Verify pending_count and GET /dashboard/affiliate-applications/{returned-id}. Do not approve/reject or reset credentials: these can send SMS.
7. GET /dashboard/affiliate-payouts?page=1&per_page=25&status=pending and paid/rejected; follow pagination. GET /dashboard/affiliate-payouts/{returned-id}; verify payout identity/status, optional amount/details, warning and available balance. Inspect IBAN only within the authorized UI; never include it in evidence.
8. GET /dashboard/affiliates/export with the same search/status filters. Check HTTP status, nonempty CSV MIME, safe filename and filter scope. Keep customer CSV private and discard it per local test-data policy; do not attach it to the report.
9. GET /dashboard/orders/{disposable-order-id} for an attributed and a non-attributed order. Check discount/commission/adjustment amounts match server strings, absent attribution renders no invented section, and the Affiliate link appears only with verified view access and released routes.
10. After permission hydration is implemented, run authorized V/M/S/P account combinations: no grants/unknown stay denied; S can read settings without V but writes require settings readiness; M does not imply V; P does not imply V or financial readiness. Check forbidden responses without using another identity's cached data. Do not send mutations to test denial. Stale 401/403, 409, 422 and network outcomes are already exercised locally; do not manufacture unsafe live errors.

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

## Verified published-page PUT result

The user confirmed Static Page ID 9 is published. PUT with all six fields and terms_page_id: 9 succeeded, and subsequent GET confirmed ID 9 persisted with all other settings unchanged. Both enabled and applications_enabled remain false. This is user-supplied live evidence, distinct from local fixture tests. No restoration to the original null page was reported; the agent made no further mutations.

## Financial transition restriction

No live Paid/Reject call is authorized by this checklist. It requires a separately named disposable test payout and explicit assurance that no transfer or external financial effect can occur. Never deliberately replay a financial mutation to provoke 409. Complete safe reads and local tests while waiting.

<details>
<summary>Historical record before this frontend completion task; superseded by the active status above</summary>

# T01 contract closure and Backend handoff

2026-11-26. **READY WITH BLOCKERS** for preparation; not production-ready and not full contract closure.

Repository root was discovered with `git rev-parse --show-toplevel`. Branch: `feat/affiliate`; HEAD: `4d2592d5f6a2210623d5ec176ed93476bf48b851`. The six existing audit documents were present as untracked files; `.env.example` already had a user edit. Their contents are preserved. No assumptions about another machine's work or history are used.

## Evidence and authority

All six existing audit documents were read. Their 19-operation inventory agrees with the local service inventory. This is a targeted closure check, not a new audit. No Laravel calls, production data access, credentials, mutations or external messages were used.

`AFFILIATE_INTEGRATION_GUIDE.pdf` was not found by workspace PDF/contract searches or recursive PDF/filename searches in the local attachment store. The only attachment identified by this request is its task text. No local OpenAPI/Swagger file was found. Consequently **PDF page references below are inherited from the approved audit, not a fresh reading of the PDF**. Restore the version 2026-11-24 guide to the task resources before claiming independent guide verification. Do not ask Backend to reconfirm already documented requirements just because the PDF is unavailable here.

`CONFIRMED_BY_GUIDE` below means an explicitly attributed requirement carried forward from the approved audit. It is not newly confirmed in T01. `CONFIRMED_BY_LOCAL_SOURCE` establishes frontend behavior only. No item qualifies as `CONFIRMED_BY_BACKEND_RUNTIME`. A missing local endpoint is not proof that the deployed Backend lacks it.

## Verified operation denominator

All paths below are relative to `/api/v1/dashboard`. Guide references are inherited from `BACKEND_CONTRACT_GAP_MATRIX.md`, E01–E19. “Counterpart” means provisional Mock implementation, not compatibility.

| ID  | Laravel operation                           | Current counterpart                         | Guide        |
| --- | ------------------------------------------- | ------------------------------------------- | ------------ |
| E01 | GET `/affiliate-settings`                   | `getSettings`                               | pp.7–8 §4.1  |
| E02 | PUT `/affiliate-settings`                   | `updateSettings`, currently PATCH           | p.8 §4.1     |
| E03 | GET `/affiliates`                           | `list`                                      | p.8 §4.2     |
| E04 | GET `/affiliates/export`                    | Missing                                     | p.8 §4.2     |
| E05 | GET `/affiliates/generate-code?name=`       | `suggestCode`, currently `/code-suggestion` | p.8 §4.2     |
| E06 | POST `/affiliates`                          | `create`                                    | p.8 §4.2     |
| E07 | GET `/affiliates/{id}`                      | `show`                                      | p.9 §4.2     |
| E08 | PUT `/affiliates/{id}`                      | `update`, currently PATCH                   | p.9 §4.2     |
| E09 | POST `/affiliates/{id}/suspend`             | `suspend`, currently no reason              | p.9 §4.2     |
| E10 | POST `/affiliates/{id}/reactivate`          | `reactivate`, currently no reason           | p.9 §4.2     |
| E11 | POST `/affiliates/{id}/reset-password`      | `resetPassword`, obsolete result            | p.9 §4.2     |
| E12 | GET `/affiliate-applications`               | Missing                                     | p.9 §4.3     |
| E13 | GET `/affiliate-applications/{id}`          | Missing                                     | p.9 §4.3     |
| E14 | POST `/affiliate-applications/{id}/approve` | Missing                                     | p.9 §4.3     |
| E15 | POST `/affiliate-applications/{id}/reject`  | Missing                                     | p.9 §4.3     |
| E16 | GET `/affiliate-payouts`                    | Missing                                     | p.9 §4.4     |
| E17 | GET `/affiliate-payouts/{id}`               | Missing                                     | p.9 §4.4     |
| E18 | POST `/affiliate-payouts/{id}/paid`         | Missing                                     | pp.9–10 §4.4 |
| E19 | POST `/affiliate-payouts/{id}/reject`       | Missing                                     | p.10 §4.4    |

Exactly **10 counterparts**: E01–E03 and E05–E11. Exactly **nine missing**: E04 and E12–E19. Source: `src/modules/affiliates/api/affiliates.service.ts:91`; its extra `activity` method at line 173 is outside this denominator. The three conditional routes remain list/settings/detail (`src/routes/privateRoutes/index.tsx:99`). There is no demonstrated real Laravel integration among the 19 operations.

## Decision register: disposition of every existing question

Q identifiers refer to the unchanged `BACKEND_QUESTIONS_AND_QA.md`. Split rows prevent a confirmed local fact from accidentally closing an unresolved Backend contract.

| Question / subdecision                                              | Classification            | Evidence and disposition                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q01 current session and login consumption                           | CONFIRMED_BY_LOCAL_SOURCE | `src/modules/auth/types/auth.types.ts:1`, `src/store/auth.ts:92`: roles only; normalization drops any unmodeled login fields. This does not prove raw live login lacks grants.                                                                                      |
| Q01 effective-grant source, refresh/revocation, Super Admin         | BLOCKED_PENDING_BACKEND   | No authoritative grant source or refresh flow in inspected auth/store code. `src/modules/roles/api/permissions.service.ts:5` is a catalog. `src/modules/admins/types/admin.types.ts:3` also exposes roles only. Blocks T02 grant hydration and exposure.            |
| Q02 exact grant names and explicit rules                            | CONFIRMED_BY_GUIDE        | Inherited p.7 §4: V=`affiliates.view`, M=`affiliates.manage`, S=`affiliates.settings.manage`, P=`affiliates.payouts.process`; settings read V-or-S/write S, management actions/application decisions M, payouts P.                                                  |
| Q02 remaining endpoint middleware and grant combinations            | BLOCKED_PENDING_BACKEND   | E03–E07, E12–E13 and export policy not fully assigned in audit's guide evidence. M does not imply V. T02 capability policy for those routes; individual later slices remain closed.                                                                                 |
| Q03 full settings write and bounds                                  | CONFIRMED_BY_GUIDE        | Inherited pp.7–8 §4.1; six required fields, read-only metadata, see table below. Do not request PATCH or preserve Mock version.                                                                                                                                     |
| Q03 settings response types/nullability                             | BLOCKED_PENDING_BACKEND   | Numeric `min_payout` example conflicts with general money-string convention; null/clear and metadata variants absent. Blocks T03 parser/write completion, not T02 transport.                                                                                        |
| Q03 optional concurrency mechanism                                  | NONBLOCKING_DEFERRED      | No verified version/ETag mechanism. Do not send `version`, infer optimistic locking, or assert last-write-wins as confirmed. Ask about protection only as an optional extension, not prerequisite to T02.                                                           |
| Q04 existing page service/filter serialization                      | CONFIRMED_BY_LOCAL_SOURCE | `src/modules/static-pages/api/static-pages.service.ts:76`, `src/modules/static-pages/utils/static-page-filters.ts:27` send page/search/publication/sort. This supersedes local notes' page-only description of frontend behavior only.                              |
| Q04 supported Backend filters, S-only access, unavailable selection | BLOCKED_PENDING_BACKEND   | Frontend serializer does not prove server support or permissions. T03 published-page selector depends on authorized access and handling of unavailable selected IDs.                                                                                                |
| Q05 management DTOs                                                 | BLOCKED_PENDING_BACKEND   | Split by E03–E06/T04 and E07–E11/T05; see precise missing fields below. No complete DTO can be inferred from prose.                                                                                                                                                 |
| Q05 application DTOs/pagination                                     | BLOCKED_PENDING_BACKEND   | E12–E15/T06 only; does not hold T02/T03 or unrelated listing work.                                                                                                                                                                                                  |
| Q05 CSV details                                                     | NONBLOCKING_DEFERRED      | E04/T04 export substep needs content headers/encoding/columns and permission; does not block ordinary list transport or settings.                                                                                                                                   |
| Q06 staff validation, reactivate reason, status results/conflicts   | BLOCKED_PENDING_BACKEND   | T04 staff field rules and T05 action rules. Suspend 10–250 is already documented; reactivate bound and status conflict semantics are not.                                                                                                                           |
| Q07 activity/history API                                            | BLOCKED_PENDING_BACKEND   | No alternative verified contract found. Mock `/activity` at service line 175 is not evidence. Full timeline unsupported pending confirmation. Exclude requests at cutover; do not block settings/list or invent actors. Product release-scope decision is deferred. |
| Q08 payout DTOs/IBAN/date/reconciliation                            | BLOCKED_PENDING_BACKEND   | T07 only. Full list IBAN, P protection and decision 409 are already documented; nested detail field/nullability and date timezone remain unknown.                                                                                                                   |
| Q09 locale header mismatch                                          | CONFIRMED_BY_LOCAL_SOURCE | `src/config/axios.helpers.ts:8` sends Accept-Language/Default-Language but no X-Locale.                                                                                                                                                                             |
| Q09 documented locale contract                                      | CONFIRMED_BY_GUIDE        | Inherited p.1: optional X-Locale ar/en, default ar, localized messages. Implement this contract without reopening it.                                                                                                                                               |
| Q09 mixed-header precedence, rendered Arabic copy                   | NONBLOCKING_DEFERRED      | Send normalized consistent language headers; verify precedence only if integration exposes a conflict. Exact Arabic PDF copy awaits restored PDF; no guessing. T11 verification.                                                                                    |
| Q10 separate Affiliate authentication                               | CONFIRMED_BY_GUIDE        | Inherited pp.1,4–7: separate Affiliate token/session; never use it for staff APIs.                                                                                                                                                                                  |
| Q10 panel ownership/deployment                                      | NONBLOCKING_DEFERRED      | External architecture workstream; not T02/T03 dependency.                                                                                                                                                                                                           |

No existing unresolved Backend question is newly closed, so the original questions document is unchanged. Local re-verification and the tooling diagnosis are recorded in these addenda.

## Settings contract boundary

The following constraints are carried forward from guide pp.7–8 via the existing field matrix:

| Field                       | Established requirement                                     | Still unknown                                                                 |
| --------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `enabled`                   | Boolean, required in full PUT                               | Exact GET/PUT serialized scalar examples                                      |
| `customer_discount_percent` | Number 1–50, at most two decimals                           | Response scalar representation                                                |
| `commission_percent`        | Number 0.5–50, at most two decimals                         | Response scalar representation                                                |
| `min_payout`                | 0–10,000; zero allowed; numeric PUT example                 | Accepted input number/string, GET/PUT output representation and precision     |
| `applications_enabled`      | Boolean, required in full PUT                               | Exact serialized example                                                      |
| `terms_page_id`             | Published static-page ID, required key                      | Nullable/clear semantics and ID wire type                                     |
| `terms_page`                | Read-only `{id,slug,title,is_published}`; excluded from PUT | Whole-object nullability, title representation, deleted/unpublished selection |

Generic JSON envelope is documented as `{success,message,data,meta?}`; errors `{success:false,message,errors}` (inherited p.1). Exact settings `data` shape after PUT is still needed. No real concurrency/version mechanism is verified. A dirty draft must survive background refetch without claiming lost-update protection. Reuse the existing paginated page service and `src/components/form/FormSelect.tsx:13`; do not create a new selector/client. If publication filtering is unsupported but access is allowed, traverse returned pagination and filter locally; an empty filtered page is not the end of results.

## Management and later DTO boundaries

These are field inventories, not complete DTO declarations. Do not mark every unspecified field optional or nullable to force parsing to pass.

| Slice                           | Documented via audit/guide                                                                                                      | Minimum missing contract                                                                                                                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T04 list E03, p.8               | Rows: id/name/code/phone/email/source/status/orders_count/pending/approved_unpaid/paid/created_at; pagination and `meta.totals` | Scalar/null fields, totals keys/types and filter scope, supported page sizes, empty envelope                                                                                                                                     |
| T04 generator E05, p.8          | Name query                                                                                                                      | Exact `data` shape/code field; do not retain `reserved:false` or claim reservation                                                                                                                                               |
| T04 create E06, p.8             | name/phone/email/platform/account_handle, optional code; 201 `{affiliate,sms_sent,sms_message}` inside data                     | Nested affiliate shape, nullable SMS copy, optional-code omission/empty representation, staff field bounds/enums. Phone canonical +9665 plus eight digits; code 4–20 alphanumeric and cross-coupon unique are already documented |
| T05 detail E07, p.9             | Profile/source/application_id/login/terms timestamps, masked bank, balances/period/orders/payouts                               | Exact nesting, nullable metadata, date defaults/range rules, nested pagination, signed monetary types; full IBAN must not be inferred here                                                                                       |
| T05 profile/status E08–E10, p.9 | Sparse writable profile via PUT; status reasons required; suspend 10–250                                                        | Complete vs partial mutation data, reactivate length, already-in-state conflict status/envelope                                                                                                                                  |
| T05 reset E11, p.9              | No-body POST, data `{sms_sent,sms_message}`                                                                                     | Exact envelope/nullable SMS fields for both outcomes; no password field or queued-delivery assumption                                                                                                                            |
| T06 applications E12–E15, p.9   | Oldest-first status/page; pending_count; nested customer; selected code approval; reject reason 10–250; 409 already decided     | List/detail pagination/types/nulls, decided_by identity shape, approval nested affiliate, rejection success data, 409 body. Decision metadata is not a full timeline                                                             |
| T07 payouts E16–E19, pp.9–10    | P-only; list full IBAN/affiliate; detail payout/balance/warning; reference 3–50; nonfuture date; rejection 10–250; terminal 409 | Exact sensitive field locations/nulls, pagination, paid/rejected result completeness, date timezone, read-back procedure after ambiguous success                                                                                 |

Reuse module services/hooks/query keys, URL filters, Yup/RHF forms, Zod boundary validation, drawers/dialogs, responsive list/query-state/loading primitives and EN/AR resources. Replace incompatible wire schemas per vertical slice. Foundation ownership and tests are specified in [08_T02_EXECUTION_SPEC.md](08_T02_EXECUTION_SPEC.md).

## Ready-to-send Backend message

The text below is prepared only; it has not been sent.

> Team — please provide sanitized representative JSON envelopes (including empty/null and relevant failure cases) for the unresolved items below. No credentials, generated passwords, real customer/staff data or real IBANs are needed.
>
> **1. Critical authentication/permission blockers — T02**
>
> - For the existing staff login `/dashboard/auth/login`, is there a supported authoritative source of the current staff member's effective permission names? Please specify the existing response field or supported endpoint/method/envelope, Super Admin representation, and refresh/revocation behavior after role changes, persisted-session restore and permission denial. Frontend currently consumes role names only and cannot safely derive grants from those or `/dashboard/permissions`. This blocks permission hydration and feature exposure, not transport preparation.
> - Please supply exact permission requirements for Affiliate list/detail/create/generate-code/export and application list/detail (E03–E07, E12–E13), including M-only access versus a separate V prerequisite. We need route/query/action checks without inventing grant implications. This blocks only those T02 capability mappings and their T04–T06 routes.
>
> **2. Settings integration blockers — T03**
>
> - For GET/PUT `/dashboard/affiliate-settings`, please send representative data envelopes, including an unset terms page if supported. What are the input/output types and allowed precision of `min_payout`, other scalar types, `terms_page_id` null/clear behavior, and `terms_page.title`/metadata nullability? We need exact parser/form serialization and a trustworthy post-save baseline. If a real concurrency mechanism exists, please document it; otherwise we will make no locking guarantee and send no Mock version field. This optional concurrency point does not block T02.
> - For GET `/dashboard/pages`, what pagination/publication/search filters are supported, and how can S-only staff obtain published terms-page options? How should a currently selected page that is now unpublished/deleted/unavailable be represented and handled on save? This blocks a usable T03 selector; frontend filter serialization alone cannot establish access or support.
>
> **3. Affiliate management DTO blockers — T04/T05**
>
> - E03 `/dashboard/affiliates`: please include empty/populated pagination and financial `meta.totals`, with exact totals keys/types, nullable row fields, filter scope and accepted page sizes. E05 `/generate-code`: exact result envelope/code field. E06 creation: nested affiliate and both SMS outcomes, including nullable message fields and accepted omitted/empty optional code. Please also specify staff name/email/platform/account_handle constraints. These block the corresponding T04 parsers/forms; we will not infer DTOs from profile prose.
> - E07 detail: please include source/application linkage, absent bank/login/terms metadata, balances, period, orders and payouts with nesting/pagination and date-filter defaults/limits. E08–E10 profile/suspend/reactivate: complete or partial result, reactivate reason bound, and already-in-state conflict status/envelope. E11 reset: representative SMS success/failure envelopes and nullability. These block T05 parsing, feedback and safe cache updates; no password values are requested.
> - E04 export: please provide filename/content headers, encoding and column contract. This is needed for the T04 export substep only, not list/settings work.
> - Is there a supported staff Affiliate/application history endpoint? If so, provide method/path, permission, pagination/order, event/actor and redaction contract. Without one, full timeline requests will remain excluded. This affects only T05/T06 history scope.
>
> **4. Later application/payout clarifications — T06/T07 only**
>
> - E12–E15 `/dashboard/affiliate-applications`: please supply list/detail/approval/rejection and already-decided 409 envelopes, pagination/page size, nullable application/customer/decision fields (especially `decided_by`) and nested approval affiliate shape. We need correct rendering, selected-code approval results and cache reconciliation. These do not block settings or ordinary Affiliate listing.
> - E16–E19 `/dashboard/affiliate-payouts`: please supply list/detail/paid/rejected and 409 envelopes with synthetic IBANs, exact IBAN field location/nullability, pagination and mutation completeness. Which timezone defines a nonfuture `transferred_at`, and what supported read-back procedure should staff use after an ambiguous paid/rejected timeout? This is needed for protected T07 rendering and avoiding duplicate financial decisions; no idempotency header or retry protocol will be assumed.

External panel ownership and visual Arabic-copy review remain internal/later follow-ups, not Backend contract blockers for T02. The message deliberately does not reopen full settings PUT, separate Affiliate authentication, explicit grant names, suspension/rejection bounds, payout protection or documented 409 behavior.

</details>
