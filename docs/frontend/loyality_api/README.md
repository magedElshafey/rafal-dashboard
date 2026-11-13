# Rafal Dashboard Loyalty — Available API Contracts

> **Reference for Codex, not an OpenAPI specification.**  
> **Source:** Six endpoints and sample requests/responses explicitly supplied by the project owner on 2026-11-13.  
> **Related requirements:** `docs/frontend/loyality/README.md`.  
> **Important:** The previously attached `rafal.postman_collection.json` contains **no loyalty-named requests**; don't infer that these newer endpoints exist in that older export. No network requests were executed for this document.

## 1. Shared integration conventions

- Routes below are **relative to the dashboard API base URL**; reuse the repository's existing configured Axios/fetch client and authentication flow. Do not invent a second base URL or prepend `/api/v1` without checking the application.
- Existing dashboard uses normal **Laravel error response shape** without issues. Reuse the current global/form error handlers and established patterns, including validation mapping; no new error normalization layer is required merely for loyalty.
- Error codes, message bodies, response for invalid inputs, and permission-denied behavior have **not been provided**. Do not assert specific status codes. Validate against the real API when practical and capture unknowns for backend handoff.
- Monetary API values are often **decimal strings** (e.g. `"11.00"`). Maintain type-safe parsing/formatting and don't silently coerce money into imprecise arithmetic. Computed values may be numbers.
- API owns financial truth, authorization, state transitions, concurrency, audit and ledger immutability. Do not fabricate persisted responses.
- In examples, API response envelope is generally `{ "success": true, "message": string, "data": ... }`; paginated endpoints additionally include top-level `meta`.

## 2. Endpoint matrix

| Method | Route | Purpose | Request data |
|---|---|---|---|
| GET | `/dashboard/loyalty/settings` | Current rules and latest version | — |
| PUT | `/dashboard/loyalty/settings` | Create next settings version | JSON body, latest `version_id`; conditional `confirm_disable` |
| GET | `/dashboard/loyalty/settings/versions?per_page=20` | Version history | `per_page=20` shown |
| GET | `/dashboard/customers/:user_id/loyalty` | Customer balance summary | Path `user_id` |
| GET | `/dashboard/customers/:user_id/loyalty/ledger?type=adjust_credit&from=2026-11-01&to=2026-11-30` | Customer ledger | `type`, `from`, `to` shown |
| POST | `/dashboard/customers/:user_id/loyalty/adjustments` | Manual credit/debit | JSON body |

`:user_id` is a route path parameter, **not** a literal colon-containing string to send.

## 3. GET /dashboard/loyalty/settings

**Example response:**

```json
{
  "success": true,
  "message": "Loyalty settings retrieved successfully",
  "data": {
    "version_id": 27,
    "is_enabled": true,
    "amount_per_point": "10.00",
    "redeem_points": 100,
    "redeem_amount": "5.00",
    "max_redeem_percent": 50,
    "min_redeem_points": 100,
    "validity_months": 12,
    "expiry_warning_days": 30,
    "value_per_point": 0.05,
    "effective_return_percent": 0.5,
    "launch_date": "2026-11-11T21:23:22+03:00",
    "saved_at": "2026-11-11T21:30:08+03:00"
  }
}
```

**Semantics:**

- `version_id` is needed when saving, to avoid overwriting another version.
- `launch_date` is read-only and set on first-ever activation; permanence must be tested.
- `value_per_point` and `effective_return_percent` are backend-calculated **nominal** values in this example.
- Monetary fields `amount_per_point` and `redeem_amount` are strings, not numbers.
- **Absent:** guest claim days. **Unknown:** representation of never-expiring points, e.g. whether `validity_months` can be null.

## 4. PUT /dashboard/loyalty/settings

**Example request:**

```json
{
  "version_id": 29,
  "is_enabled": true,
  "amount_per_point": 11,
  "redeem_points": 100,
  "redeem_amount": 5,
  "max_redeem_percent": 50,
  "min_redeem_points": 100,
  "validity_months": 12,
  "expiry_warning_days": 30
}
```

**Only when disabling the programme**, add `"confirm_disable": true` as instructed by the supplied backend contract.

**Example response:**

```json
{
  "success": true,
  "message": "Loyalty settings saved successfully",
  "data": {
    "version_id": 30,
    "is_enabled": true,
    "amount_per_point": "11.00",
    "redeem_points": 100,
    "redeem_amount": "5.00",
    "max_redeem_percent": 50,
    "min_redeem_points": 100,
    "validity_months": 12,
    "expiry_warning_days": 30,
    "value_per_point": 0.05,
    "effective_return_percent": 0.4545,
    "launch_date": "2026-11-11T21:23:22+03:00",
    "saved_at": "2026-11-13T17:23:02+03:00"
  }
}
```

**Contract rules / frontend notes:**

- Read `version_id` from the **most recent GET or successful PUT response**. A hard-coded version in Postman is not valid for future requests.
- For a confirmation to disable, show the documented effects **before** sending `confirm_disable: true`.
- Return `version_id` replaces older form version; refresh settings versions history after save.
- Business constraints: `amount_per_point` 0.01–1000 (2 decimals); `redeem_points` integer 1–100000; `redeem_amount` 0.01–10000 (2 decimals); `max_redeem_percent` integer 1–100; `min_redeem_points` integer 0–100000; `validity_months` 1–60 when enabled; `expiry_warning_days` integer 1–90 and shorter than validity. Server enforcement **not proven** by sample success responses.
- Suggested 10% return confirmation is **proposed** business behavior and not documented as a request flag.
- **Missing request field:** guest claim days (`0..365`), needed by Story 1.
- **Unknown:** no-expiry request representation; stale-version rejection response; exact warning-day calendar-month comparison; rounding and precision rules.

## 5. GET /dashboard/loyalty/settings/versions

**Documented invocation:**

```http
GET /dashboard/loyalty/settings/versions?per_page=20
```

**Representative (shortened) response from the supplied example:**

```json
{
  "success": true,
  "message": "Loyalty settings history retrieved successfully",
  "data": [
    {
      "id": 30,
      "saved_at": "2026-11-13T17:23:02+03:00",
      "admin": { "id": 1, "name": "Super Admin" },
      "values": {
        "is_enabled": true,
        "amount_per_point": "11.00",
        "redeem_points": 100,
        "redeem_amount": "5.00",
        "max_redeem_percent": 50,
        "min_redeem_points": 100,
        "validity_months": 12,
        "expiry_warning_days": 30,
        "effective_return_percent": 0.4545
      },
      "previous_values": {
        "is_enabled": true,
        "amount_per_point": "10.00",
        "redeem_points": 100,
        "redeem_amount": "5.00",
        "max_redeem_percent": 50,
        "min_redeem_points": 100,
        "validity_months": 12,
        "expiry_warning_days": 30,
        "effective_return_percent": 0.5
      }
    },
    {
      "id": 21,
      "saved_at": "2026-11-11T21:23:22+03:00",
      "admin": { "id": 73, "name": "loyalty-review-mm" },
      "values": {
        "is_enabled": true,
        "amount_per_point": "10.00",
        "redeem_points": 100,
        "redeem_amount": "5.00",
        "max_redeem_percent": 50,
        "min_redeem_points": 100,
        "validity_months": 12,
        "expiry_warning_days": 30,
        "effective_return_percent": 0.5
      },
      "previous_values": null
    }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 20, "total": 10 }
}
```

**Important:** The actual supplied example contained versions `30..21`. The excerpt above intentionally retains only two records to show shape; it is not a claim the endpoint returns only two. Some consecutive versions can have identical `values` and `previous_values`.

- Build field-by-field change history from `values` vs `previous_values` (handle `null`).
- Pagination meta exists; confirm actual `page` query argument and sorting semantics if needed.
- Data shows staff and before/after settings; a distinct audit service was not documented.

## 6. GET /dashboard/customers/:user_id/loyalty

**Example response:**

```json
{
  "success": true,
  "message": "Customer loyalty retrieved successfully",
  "data": {
    "available": 5127,
    "pending": 0,
    "held": 0,
    "expiring_soon": {
      "points": 100,
      "expires_at": "2026-11-21T21:29:08+03:00"
    },
    "is_blocked": false
  }
}
```

- Use for summary tiles and blocked badge. `expiring_soon` should not be added to total balances as an independent bucket.
- Unknown whether `expiring_soon.expires_at` is the *earliest* expiry when several lots qualify.
- Blocked/deleted customer special responses are not supplied.

## 7. GET /dashboard/customers/:user_id/loyalty/ledger

**Documented filter invocation (as in screenshot):**

```http
GET /dashboard/customers/:user_id/loyalty/ledger?type=adjust_credit&from=2026-11-01&to=2026-11-30
```

**Documented query params:** `type`, `from` (YYYY-MM-DD), `to` (YYYY-MM-DD). `per_page` and `page` support for this endpoint are **not explicitly documented** by the request screenshot, even though pagination metadata is returned. Response example shows 50 per page.

**Representative response:**

```json
{
  "success": true,
  "message": "Customer loyalty ledger retrieved successfully",
  "data": [
    {
      "id": 116,
      "created_at": "2026-11-13T17:25:44+03:00",
      "type": "adjust_credit",
      "label": "تعديل يدوي",
      "bucket": "available",
      "points": 5000,
      "lot_expires_at": "2027-11-13T23:59:59+03:00",
      "actor_type": "admin",
      "actor_name": "Super Admin",
      "reason": "customer_service",
      "reason_label": "مبادرة خدمة عملاء",
      "note": "Test credit for loyalty QA",
      "order": null
    }
  ],
  "meta": { "current_page": 1, "last_page": 1, "per_page": 50, "total": 6 }
}
```

**Important:** The actual response supplied six records, all `adjust_credit` (IDs 116, 100, 99, 98, 83, 82); the excerpt above uses one representative record. Do not expect `data.length === meta.total` on a paginated response.

- Ledger rows include: time, movement type, readable label, bucket, points, lot expiry, actor, reason/code + label, staff-only note, nullable order.
- `order` shape when non-null is **unknown**: do not assume `order.id`, `order.number`, or order URL without evidence.
- All recorded examples are positive credits; the sign convention and labels for debits, other event types and buckets are **not shown**.
- No update/delete ledger endpoints are supplied. Ledger must render **read-only** even if user has adjust permission.
- **CSV export not documented**; current-filter export must cover all matching rows, not merely current page.
- Validate allowed filter type values, date inclusivity/time zone, sort order and pagination request arguments.

## 8. POST /dashboard/customers/:user_id/loyalty/adjustments

**Example request:**

```json
{
  "type": "credit",
  "points": 5000,
  "reason": "customer_service",
  "note": "Test credit for loyalty QA",
  "notify_customer": false
}
```

- `type`: `credit` or `debit` (input). Ledger type on success is expected to be `adjust_credit` or `adjust_debit`.
- `points`: integer 1–100,000.
- `reason`: dropdown required. Codes **observed**: `customer_service`, `other`. Codes for "تعويض عن مشكلة في طلب" / "تصحيح خطأ في الرصيد" **not provided**, don't guess.
- `note`: required, 10–250 chars, internal only.
- `notify_customer`: Boolean, default false in UI.
- **Not present in request contract:** optional `order_number` / `order_id` for the story's `RF-#####` linked-order control. Do not send a made-up field.
- Debit must not exceed available; simultaneous debits must be guarded atomically by backend. Sample response does **not** verify this.

**Example response:**

```json
{
  "success": true,
  "message": "Loyalty points adjusted successfully",
  "data": {
    "available": 5127,
    "pending": 0,
    "held": 0,
    "expiring_soon": {
      "points": 100,
      "expires_at": "2026-11-21T21:29:08+03:00"
    },
    "is_blocked": false
  }
}
```

**Mutation handling:**

- On success, backend returns current summary (not the new ledger entry ID). Update/invalidate summary and invalidate ledger, using existing TanStack Query conventions and exact customer-scoped query keys.
- Don't optimistic-update balance or insert a speculative ledger row.
- Form must be non-reentrant while saving (prevent double submissions).
- Notification delivery / adjustment audit are backend behaviors needing verification; success response only reports new summary.

## 9. Known backend-contract gaps / verification register

| Priority | Item | Status / precise ask |
|---|---|---|
| P0 | Guest claim period | Expose configurable days 0–365 on settings GET/PUT/history. |
| P0 | Link adjustment to order | Document/add optional order reference to adjustments POST and non-null ledger order representation. |
| P0 | Never-expiring points | Document how GET/PUT represent 'لا تنتهي' and warning days behavior. |
| P0 verify | Security + transaction rules | Test permissions, stale version conflicts, nonnegative atomic debits, immutable ledger, first launch date, disable semantics. |
| P1 | Adjustment reason codes | Provide official enum for all four UI reasons. |
| P1 | Ledger event types/filter/pagination | Provide complete type enum, `page`/`per_page`, filter date boundaries and sort. |
| P1 | CSV export | Confirm backend export option or approve safe bounded client-side export of filtered results. |
| P1 | Preview math | Confirm points rounding, precision, nominal vs 500 SAR realized return. |
| P1 | Expiring soon semantics | State `expires_at` meaning with multiple lots; null/empty behavior. |
| P1 | Blocked/deleted behavior | Provide anonymised read-only deleted customer behavior; confirm blocked adjustments remain frozen. |
| P1 | Notifications | Confirm send behavior when `notify_customer: true` and failure semantics. |
| P2 | 10% warning | Product decision needed; AS-01 is explicitly 'proposed'. |
| P2 | Adjustment ID in response | Optional convenience only; not essential to implement. |

**Explicit non-gap:** Existing standard Laravel error shape is already accepted across the dashboard. Reuse it; no need to request a fresh generic error response contract before beginning.

## 10. Suggested frontend integration sequence

1. Inspect repository's API client, auth/permission handling, query hooks/keys, data tables, dialogs, forms, validation, i18n, styling and tests in **read-only mode**.
2. Add supported settings and customer loyalty typed API methods using existing conventions.
3. Implement settings form/preview and versions with precise invalidation (never request settings per keystroke).
4. Add customer **النقاط** tab, summary and ledger with server-controlled filters/pagination.
5. Add adjustment dialog with supported fields only and conservative mutation UX.
6. Test supported flows; collect only exact backend-dependent gaps in one handoff, do not block all work.

**Do not use placeholder success data, new endpoints, speculative fields, or imaginary auth rules to claim feature completion.**
