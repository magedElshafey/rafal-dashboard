# Coupons backend integration notes

- Coupons use the real backend only. The paginated Index endpoint is `GET /dashboard/coupons` and receives only `page`.
- There is no Show endpoint. Edit takes a complete snapshot of the selected Index row and does not issue a detail request.
- Create and Update use JSON at `POST /dashboard/coupons` and `PUT /dashboard/coupons/:id`. Boolean writes are numeric `0` or `1`.
- Update requires the full writable Coupon body. Every changed Save resends all current writable values; React Hook Form dirty state is used only to disable a pristine Edit submission and never determines transport inclusion. Nullable fields use their canonical JSON `null` representation.
- Coupon types are `percent` and `fixed`. Percent values are limited to 0–100. `max_discount_amount` applies only to percent Coupons, so the Dashboard hides it for fixed Coupons and serializes `max_discount_amount: null` on a full fixed Update. Create retains its established behavior of omitting that non-applicable field.
- `starts_at` and `ends_at` are independently nullable and have an asymmetric contract: writes use `YYYY-MM-DD HH:mm:ss`, while reads return offset-aware timestamps such as `YYYY-MM-DDTHH:mm:ss+00:00`. The form uses `datetime-local`; the frontend currently preserves backend wall-clock components on read and applies no browser-local timezone conversion. When both exist, start must be before or equal to end.
- The canonical backend timezone semantic is still pending. All Coupon parsing/serialization is isolated in `coupon-datetime.ts`; no store or regional timezone is hardcoded.
- Coupon-code constraints and uniqueness are backend-owned. Structured validation errors are mapped into the form.
- Delete uses `DELETE /dashboard/coupons/:id` with no body. Successful mutations invalidate only Coupon list queries.
