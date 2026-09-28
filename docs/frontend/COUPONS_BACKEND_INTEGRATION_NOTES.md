# Coupons backend integration notes

- Coupons use the real backend only. The paginated Index endpoint is `GET /dashboard/coupons` and receives only `page`.
- There is no Show endpoint. Edit takes a complete snapshot of the selected Index row and does not issue a detail request.
- Create and Update use JSON at `POST /dashboard/coupons` and `PUT /dashboard/coupons/:id`. Boolean writes are numeric `0` or `1`.
- Update is partial: only React Hook Form dirty fields are sent. Nested localized values remain granular, and nullable fields are explicitly cleared with JSON `null`.
- Coupon types are `percent` and `fixed`. Percent values are limited to 0–100. `max_discount_amount` applies only to percent Coupons, so the Dashboard hides and omits it for fixed writes. The backend enforces `max_discount_amount = null` whenever the type is fixed, preventing hidden stale values from surviving a fixed state.
- `starts_at` and `ends_at` are independently nullable and have an asymmetric contract: writes use `YYYY-MM-DD HH:mm:ss`, while reads return offset-aware timestamps such as `YYYY-MM-DDTHH:mm:ss+00:00`. The form uses `datetime-local`; the frontend currently preserves backend wall-clock components on read and applies no browser-local timezone conversion. When both exist, start must be before or equal to end.
- The canonical backend timezone semantic is still pending. All Coupon parsing/serialization is isolated in `coupon-datetime.ts`; no store or regional timezone is hardcoded.
- Coupon-code constraints and uniqueness are backend-owned. Structured validation errors are mapped into the form.
- Delete uses `DELETE /dashboard/coupons/:id` with no body. Successful mutations invalidate only Coupon list queries.
