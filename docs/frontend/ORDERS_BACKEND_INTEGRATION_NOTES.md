# Orders backend integration

Orders use the real backend through shared `$http`: page → TanStack Query hook → Orders service → existing Axios. Both `/dashboard/orders` and `/dashboard/orders/:id` are lazy routes. There are no create, edit, delete, refund, or bulk operations.

## Runtime contracts

- `GET /dashboard/orders/statuses` supplies `{ value, label, customer_status }`. All nine supplied statuses are translated in English and Arabic. Unknown nonempty values use the backend label or humanized value. Manual Postman enum descriptions are not authoritative.
- `GET /dashboard/orders` returns `data[]` with identity, customer, items_count, decimal total, currency, payment_status, boolean/numeric is_gift, nullable warehouse and placed_at. Meta contains current_page, last_page, per_page and total, mapped to the existing pagination model. The backend default page size is retained; no page-size selector is added.
- Search and all filters are server-driven, URL-backed, and included in query identity. Wire keys: search, status, payment_status, date_from, date_to, warehouse_id, is_gift, is_guest, plus page. Backend also supports per_page. Boolean All omits the parameter, Yes sends 1, No sends 0. Calendar dates are passed unchanged as YYYY-MM-DD; invalid dates/ranges disable the query and are rejected by the serializer. The shared search control uses its established 600 ms debounce (350 ms was a recommendation). Clearing filters also cancels pending search input. Later-page failures retain loaded rows and provide a scoped retry.
- Warehouse options reuse `useWarehouses` and the shared paginated `FilterSelect`, without per-row requests.
- Current real payment evidence confirms only `paid` and `pending`. Filter configuration is isolated; domain parsing accepts future nonempty strings.
- Show includes shipping_address, items, money, coupon, payment, warehouse, status_history, allowed_transitions and timestamps. Money is backend-authoritative: subtotal, discount_total, shipping_fee, personalization_total, gift_wrap_fee, taxable_amount, nested `vat: { rate, amount }`, total and currency. Amount strings retain precision during display; no VAT/totals are recomputed.
- Item variant_attributes preserve exact string keys, including Unicode, and string values. Nested/non-string values and prototype-manipulation keys are rejected. Only exact `color` with six-digit HEX receives a swatch; its text remains visible. Legacy colors are text only.
- Identity, quantities, money, workflow status and transition fields are validated before reaching JSX. Secondary nullable text has isolated fallbacks. Unknown coupon payloads are retained without guessed display fields.
- Offset-aware timestamps use the shared date/time formatter and its browser-local timezone convention.

## Confirmed Gift detail

The real full Order response confirms a nested `gift` object with `is_anonymous`, nullable string `message`, `wrap`, decimal string `wrap_fee`, `buyer: { type, name, email, phone }`, and `recipient: { name, phone, city: { id, name } | null, district, street_details }`. Both Gift flags accept booleans or numeric 0/1, not string booleans. Present Gift objects require the confirmed structure; malformed flags, money, buyer or recipient data fail the detail query safely. Future extra keys are ignored.

The domain uses `OrderGift | null` with `isAnonymous`, `wrapFee`, and recipient `streetDetails`. Missing or explicit null `gift` becomes null; no Gift is inferred from `gift_wrap_fee`, Index `is_gift`, coupon, or shipping address. The backend remains authoritative for both flags and the fee. `orderMoneyLabel` displays `wrapFee` in the Order's `money.currency` without floating-point calculation.

The Gift section has localized English/Arabic labels, Yes/No flags, a nullable-message fallback, and semantic Buyer/Recipient groups with direction-safe address fields. Buyer information remains visible to admins for anonymous gifts. GET Show and successful full-detail PATCH responses use the same `normalizeOrderDetail` path and preserve the complete Gift data.

## Status mutation

`PATCH /dashboard/orders/:id/status` sends only `{ "status": "processing" }` through `$http.patch`, which sets application/json. No Orders endpoint currently needs multipart/form-data; Orders contains no FormData mutation.

The only mutation choices are the current Show's allowed_transitions, never the complete status metadata list. A labelled confirmation dialog requires explicit submission. A synchronous lock and pending state prevent duplicate submissions; mutation retry is disabled. A fresh failed detail read disables further transitions until recovered.

Success is validated independently of optional returned detail. Valid current Show-shaped data replaces the exact detail cache; the exact detail and Orders lists are invalidated. An older in-flight detail request is cancelled before replacement. No history or transitions are fabricated, and status metadata/unrelated modules are not invalidated. An evolved returned detail cannot turn a persisted backend success into a false mutation failure.

The real failure envelope `{ success: false, message, errors: { status: [...], allowed_transitions: [...] } }` is handled for HTTP failures and resolved failure envelopes. The page and confirmation stay open; safe message/status feedback is shown inline. allowed_transitions is never rendered as validation text. Its presence triggers exact canonical Show refresh, never a PATCH retry. Interceptor notifications are suppressed to avoid duplicate feedback. Raw Error.message/config/stack are never displayed.

## Backend-owned gaps

Non-null coupon schema remains unknown. Payment statuses have no authoritative metadata endpoint. Native YYYY-MM-DD date serialization is isolated pending final backend wire-format confirmation.

## Verification

Focused Vitest/React Testing Library tests cover real fixtures, transport, parsing, list/detail rendering, filters, pagination failures, transitions, cache scope, and locale parity. Browser verification is intentionally excluded by the task.
