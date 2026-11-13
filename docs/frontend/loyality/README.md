# Rafal Admin — Loyalty Programme: Business & User Stories

> **Purpose:** Implementation reference for Codex and frontend engineers.  
> **Scope:** (1) Configure the loyalty programme; (2) View a customer's points and adjust the balance.  
> **Source of truth:** The two user stories supplied by the product team in the project conversation. `Rafal_BRD_v0_4.pdf` describes EPIC-10 (Phase 2) at a high level (earning, redemption and balance display); the detailed stories below supersede that high-level overview for these two workflows.  
> **Companion API reference:** `docs/frontend/loyality_api/README.md`.  
> **Status:** Frontend implementation reference; **not** evidence that all backend behavior has been verified.

## 0. Delivery principles

- Implement everything supported by the current APIs and existing dashboard architecture **now**. Do not block unrelated frontend work on missing backend functionality.
- Reuse the repository's layouts, routes, permissions, API client, query/mutation hooks, forms, validation, tables, pagination, dialogs, inputs, notifications, translations, currency/date formatters, and design-system components wherever appropriate. **Inspect before implementing.**
- Do not create a new design system, parallel API abstraction, generic framework, or feature-wide state store without a proven need.
- Prefer accessible, responsive, fast, maintainable UI. Avoid duplicate requests and unnecessary client-side rendering; keep query keys scoped and invalidation precise.
- Backend is the authority for monetary calculations, balances, eligibility, adjustment transactions, permissions, versioning, and audit trails. Frontend validation/preview enhances UX, not security.
- Follow the existing Laravel error response shape and existing dashboard error-handling patterns; do not introduce an alternate error schema.
- Clearly mark backend-dependent elements without inventing requests, response fields, permission semantics, or fake persisted state. Collect blockers in a handoff list at the end.
- `loyality` is intentionally spelled as requested in the documentation paths; use established repository conventions for runtime naming.

## 1. Domain concepts

| Term | Meaning / invariant |
|---|---|
| **Programme rules / settings** | Configurable earning, redemption, validity and other values. Saving creates a **new version**; new rules apply to new orders/credits immediately (BR-12). |
| **Launch date** | Established on the **first ever activation** and never reset by disable/re-enable (BR-01). |
| **Available points** | Points available for redemption/manual debit, subject to other business restrictions. |
| **Pending points** | Earned but not yet available. |
| **Held points** | Temporarily reserved; **not** to be conflated with available points. |
| **Expiring soon** | Points within the configured warning period; potentially a subset of available points, **not an additional balance**. Confirm the backend's exact bucket semantics. |
| **Frozen/blocked customer** | Account flagged `is_blocked`. Adjustments are allowed for blocked customers but points remain frozen (Story 2 AS-01). |
| **Ledger** | Append-only movement history. Corrections create `adjust_credit` / `adjust_debit` rows, never edits or deletes (BR-03). |
| **Lot** | Points credit unit with an expiry date under the applicable settings. Historical lots/ledger entries are not recalculated when rules change. |
| **Audit history** | Records user, date/time, changes or adjustment details. Settings version history and adjustment ledger are available; independent backend audit guarantees are not asserted by the examples. |

## 2. Story 1 — Configure the loyalty programme

**User story:** As a staff member with `loyalty.settings.manage`, I want to set every loyalty value from the dashboard so Rafal can tune the programme without a release.

### Preconditions / access

- `loyalty.settings.manage`: can edit and save.
- `loyalty.view`: settings read-only; hide **حفظ**. Follow existing permission guards and enforce backend access separately.

### Main flow

1. Open **برنامج الولاء → الإعدادات**.
2. Load current settings. While editing, update a live example: **طلب بقيمة 500 ر.س يكسب {العدد} نقطة تعادل {المبلغ} ر.س (عائد {النسبة}%)**.
3. Save: validate, submit latest `version_id`, persist a **new** rule version and audit entry.
4. On first-ever activation, permanently record `launch_date` (BR-01).
5. On switch-off, show a confirmation explaining: **no earning, no redemption, balances retained, maturity and expiry continue**. Submit `confirm_disable: true` when confirmed.
6. **سجل التغييرات** lists rule versions, timestamp, staff member, before/after values.

### Field specifications

| UI label (Arabic) | API field / representation | Input | Rules | Required error / display |
|---|---|---|---|---|
| تفعيل البرنامج | `is_enabled` | toggle | First activation permanently sets launch date | — |
| تاريخ بدء البرنامج | `launch_date` (response only) | read-only label | Empty until first activation; immutable afterwards | — |
| مبلغ الشراء لكل نقطة (ر.س) | `amount_per_point` | numeric | 0.01–1000.00; max 2 decimals | يرجى إدخال مبلغ الشراء لكل نقطة |
| قيمة الاستبدال — عدد النقاط | `redeem_points` | integer | 1–100,000 | يرجى إدخال عدد النقاط |
| قيمة الاستبدال — المبلغ (ر.س) | `redeem_amount` | numeric | 0.01–10,000.00; max 2 decimals | يرجى إدخال قيمة الاستبدال |
| الحد الأقصى للاستبدال (% من المبلغ المستحق) | `max_redeem_percent` | integer | 1–100 | النسبة يجب أن تكون بين 1 و100 |
| الحد الأدنى للاستبدال (نقطة) | `min_redeem_points` | integer | 0–100,000 | يرجى إدخال الحد الأدنى |
| صلاحية النقاط | `validity_months` (?) | radio + number | **لا تنتهي** / **تنتهي بعد N شهراً**; if finite, N=1–60 | يرجى إدخال مدة الصلاحية |
| التنبيه قبل انتهاء الصلاحية (أيام) | `expiry_warning_days` | integer | Shown/required only if expiry enabled; 1–90, must be shorter than validity period | مدة التنبيه يجب أن تكون أقل من مدة الصلاحية |
| مدة مطالبة الزائر بنقاط طلباته (أيام) | **not in available API** | integer | 0–365; `0` turns claims off | Required |
| Live preview | local derived view | label | Update while typing; explain points, SAR value and percentage | — |
| حفظ | PUT mutation | button | Hidden for read-only staff; disable/guard while pending | — |

**Not settled by the supplied contract:** How the API represents **no expiry** (`null` vs separate flag vs other); how to set/read guest claim days; exact earning rounding for a 500 SAR preview. These must not be silently invented.

### Preview example / business math

Given **10 SAR per point**, **100 points = 5 SAR**, the 500 SAR example must say:

> طلب بقيمة 500 ر.س يكسب 50 نقطة تعادل 2.50 ر.س (عائد 0.5%)

- Nominal value per point: `redeem_amount / redeem_points`.
- Nominal return percent: `(redeem_amount / redeem_points / amount_per_point) * 100`.
- **Caution:** `500 / amount_per_point` can be fractional. Actual earned-points rounding and display precision must match the backend; the response's `effective_return_percent` is the *nominal* rate, not necessarily the exact return from a fixed 500 SAR sample.
- Only show a valid preview when numeric inputs are valid. Do not call the settings endpoint on every keystroke; compute locally based on the loaded settings/form values.

### Acceptance criteria

| ID | Verifiable outcome |
|---|---|
| AC-01 | With 10 SAR/point and 100 points = 5 SAR, preview exactly matches the 500 SAR example above. |
| AC-02 | Changing earning configuration affects **new orders only**; historical ledger rows unchanged. Backend rule; frontend must not rewrite old rows. |
| AC-03 | First activation on 2027-02-01 fixes launch date to 2027-02-01; read-only forever. |
| AC-04 | 1 month validity + 40 warning days is rejected with the specified warning validation message. |
| AC-05 | Programme off ⇒ no new earning/redemption, balances retained, maturity/expiry continue. |
| AC-06 | `loyalty.view` ⇒ read-only form, save button hidden. |

### Alternative scenarios

- **AS-01 (proposed; confirm product approval):** Effective return above 10% triggers confirmation **نسبة العائد مرتفعة، هل تريد المتابعة؟** before save.
- **AS-02:** Re-enable never changes launch date; orders placed while off never earn retroactively.
- **AS-03:** Concurrent change is rejected; show **تم تعديل الإعدادات من مستخدم آخر، يرجى إعادة التحميل**; do not overwrite someone else's settings. Use API `version_id`; refetch deliberately and avoid erasing in-progress edits silently.

### Settings version history UI

- GET versions, newest-first by version/time if guaranteed by backend (do not rely on undocumented sorting without testing).
- Display timestamp, editor, and a diff from `previous_values` to `values`; handle `previous_values: null` for initial version.
- A version with no actual value difference may appear: the story says every save creates a version. Do not fabricate a difference.
- Support the repository's existing pagination/table components and query patterns.

## 3. Story 2 — View customer's points and adjust the balance

**User story:** As staff with `loyalty.customer.view`, I want to see a customer's points, and with `loyalty.adjust` correct them to answer questions and fix problems.

### Preconditions / access

- Must already have `customers.view` **and** `loyalty.customer.view` to view the **النقاط** tab.
- Additional `loyalty.adjust` for **تعديل الرصيد**; hide the action otherwise.
- Deleted customer: anonymised ledger, **read-only**, no adjustments (AS-02).

### Main flow

1. Open existing Customer Details page, select **النقاط** tab.
2. Show live backend summary: **متاحة / معلّقة / محجوزة / تنتهي قريباً**, plus **مجمّد** badge when `is_blocked`.
3. Show append-only ledger: datetime, label/type, signed points, bucket, order link, lot expiry, actor, reason, internal note if authorized; filter by type/date; 50 rows/page; CSV for **current filter (all matched records, not just visible page)**.
4. If allowed, click **تعديل الرصيد**, fill and confirm dialog.
5. Server creates `adjust_credit` or `adjust_debit` ledger row/lot and audit record; optionally sends customer notification (LOY-09); reload affected summary/ledger.

### Summary / table fields

| UI | API response | Notes |
|---|---|---|
| متاحة | `available` | Authoritative available points |
| معلّقة | `pending` | Separate bucket |
| محجوزة | `held` | Separate bucket |
| تنتهي قريباً | `expiring_soon.points`, `expiring_soon.expires_at` | `expires_at` semantics with multiple lots not documented; avoid treating as separate additive bucket |
| مجمّد | `is_blocked` | Badge for blocked accounts |
| Ledger | `created_at`, `label`, `type`, `points`, `bucket`, `order`, `lot_expires_at`, `actor_type`, `actor_name`, `reason`, `reason_label`, `note` | Rows must not have edit/delete controls |
| Filters | `type`, `from`, `to` | Server-side query params; type enum/date boundaries TBD |
| Pagination | `meta.current_page`, `last_page`, `per_page`, `total` | Response example uses 50 per page; exact `page` request support to verify |
| CSV | **no export contract supplied** | Avoid incorrectly exporting only current page; choose backend export or bounded client-side all-pages method once agreed |

### Adjustment dialog

| UI label | API field | Rules |
|---|---|---|
| نوع التعديل | `type` | Radio: **إضافة / خصم**; payload enum `credit` / `debit`; required: **يرجى اختيار نوع التعديل** |
| عدد النقاط | `points` | Integer 1–100,000; required: **يرجى إدخال عدد النقاط** |
| السبب | `reason` | Required: **تعويض عن مشكلة في طلب / تصحيح خطأ في الرصيد / مبادرة خدمة عملاء / أخرى**; backend enum confirmed for `customer_service` and `other`, remaining keys TBD; **يرجى اختيار السبب** |
| ملاحظة داخلية | `note` | Required, 10–250 chars; **يرجى كتابة ملاحظة**; never show to customer |
| رقم الطلب المرتبط | **not in available POST contract** | Optional `RF-#####`; invalid: **رقم الطلب غير صحيح**; cannot implement persisted association without backend contract |
| إشعار العميل | `notify_customer` | Toggle default false; sends notification when enabled |
| تأكيد | POST mutation | Do not submit invalid form or allow duplicate submits |

### Critical invariants

- Adjustments **append** a new ledger row; never edit/delete existing rows (BR-03).
- `debit` must never exceed the **available** points; enforce at backend transaction boundary even if UI prevalidates with currently loaded balance.
- `credit` creates a new lot with appropriate expiry date. Historical lot expiries are not recalculated by settings changes.
- Blocked customer can receive adjustments, but balance remains frozen.
- Deleted customer ledger is anonymised/read-only; no adjustment possible.
- Customer notification only when `notify_customer: true`; backend delivery result is not proved by a success adjustment response.
- Internal notes are staff-only and must not leak to customer-facing views.

### Acceptance criteria

| ID | Verifiable outcome |
|---|---|
| AC-01 | Manual debit above available balance rejected with **لا يمكن أن يصبح الرصيد سالباً بتعديل يدوي**. |
| AC-02 | Credit 100 creates a 100-point lot with expiry; audit records staff member, points and reason. |
| AC-03 | `loyalty.customer.view` without `loyalty.adjust`: adjustment action hidden. |
| AC-04 | If notify toggle is on, successful adjustment triggers customer notification. |
| AC-05 | Ledger rows have **no** edit/delete controls. |

### Alternative scenarios

- **AS-01:** Blocked customer: adjustment still possible but balance stays frozen.
- **AS-02:** Deleted customer: anonymised ledger read-only, adjustment disabled.

## 4. Engineering scope & acceptance strategy

### Build without waiting for backend changes

- Settings GET, editable/read-only UI, supported fields, existing-style validation, save + disable confirmation, setting versions table/history UI.
- Customer details **النقاط** tab, summary tiles, blocked badge, ledger table, type/date filter UI, current-page server pagination (subject to `page` contract), supported adjustment fields, submission, loading/error/success states.
- Route/permission integration using established auth/authorization conventions; preserve existing customer details behavior.
- After settings PUT: use returned version/settings to refresh relevant cache and invalidate version history precisely. After adjustment POST: update summary from returned response or invalidate summary; invalidate ledger. No speculative balance updates.
- Arabic RTL, responsive design, keyboard-accessible dialogs/controls, visible validation feedback, focus management, semantic tables, sensible date/currency formatting.
- Reuse tests/tools already in the repo; test calculations, validation, read-only permissions, mutation states, history diffs, filters, and non-duplication of requests.

### Implement conservatively / defer only unsupported sub-parts

| Item | Current disposition |
|---|---|
| Guest claim days | Backend field missing: do not pretend to persist it. Record exact gap for backend. |
| No-expiry setting | Representation undocumented: wait for contract for *this field only*, not whole page. |
| Order-linked adjustments | POST does not document order identifier: do not send invented key; record gap. |
| CSV of all matching ledger rows | No export endpoint documented: choose bounded all-pages client implementation only if safe and explicitly decided; otherwise clearly mark pending. |
| Return >10% confirmation | Product story labels **proposed**: only implement as an approved UX safeguard if product decision confirms. |
| Rule rounding, expiry validation across calendar months | Confirm backend algorithm for exact parity; do not replace it with assumptions. |
| Deleted-customer response, full reason/type enums, fine-grained permissions | Verify with repo/backend as needed; record precise scenarios. |
| Error shape | Already standard Laravel pattern used across this dashboard; reuse existing handling, no new schema work needed. |

### Definition of done (per completed slice)

1. Implemented behavior traced to an AC/business rule and actual API field.
2. No duplicate components/utilities when a suitable equivalent exists; any new component has a specific reuse or composition reason.
3. Queries stable/cached appropriately, no request per keystroke, no accidental refetch loop or full-table download to render one page.
4. Accessibility: semantic labels, RTL, error announcements, focus return/management, keyboard operation, disabled/loading states; no color-only status.
5. Error and empty/loading states mirror established dashboard UX; permissions do not rely only on hiding controls.
6. Responsive verified at existing project breakpoints; formatting follows current locale and SAR conventions.
7. Focused tests pass and no regression in existing customer details/settings screens.
8. Backend gaps documented precisely (endpoint/field/expected behavior) without blocking supported implementation.

## 5. Backend handoff register — do not block unrelated work

- Add/read/write/history **guest claim days** configuration (`0..365`).
- Define **no expiry** representation and expiry warning behavior when disabled.
- Add/document optional **linked order number** on adjustment POST; validate order belongs to intended customer.
- Confirm full `reason` enums, ledger `type` enums, pagination arguments, date boundaries, CSV export contract.
- Confirm preview's **points rounding** vs nominal `effective_return_percent`.
- Verify stale `version_id` rejection, permissions, debit atomicity/nonnegative balance, append-only rows, first launch permanence, programme disable semantics, blocked/deleted users, credit lot expiry, notification delivery.
- Confirm whether >10% warning is officially approved (explicitly *proposed* in story).

**Implementation note:** The supplied API responses demonstrate shape and selected happy paths. They do **not** prove server-side validation, authorization, atomicity, historical non-recalculation, or notification delivery. These are verification items, not assumptions.
