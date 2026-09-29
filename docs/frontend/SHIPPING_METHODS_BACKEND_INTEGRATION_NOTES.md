# Shipping Methods backend integration notes

Shipping Methods is a paginated CRUD resource. The dashboard uses `GET /dashboard/shipping-methods`, `POST /dashboard/shipping-methods`, `PUT /dashboard/shipping-methods/:id`, and `DELETE /dashboard/shipping-methods/:id`. Create and Update use `multipart/form-data`; Delete has no request body.

Shipping Methods use the real backend exclusively through the shared HTTP client. The former frontend mock mode and its environment flag have been removed.

Update is partial for every documented writable field. Omitted fields remain unchanged, so the frontend maps React Hook Form dirty fields to a dedicated partial domain payload before the service converts them to wire keys.

Omitting `sort_order` on Update keeps its existing value, and no clearing syntax is confirmed. Edit therefore prevents clearing an existing Sort Order as unsupported frontend behavior; `0` and negative integers remain valid. Create continues to allow Sort Order to be omitted.

API response prices are strings such as `"25.00"`; the service normalizes them to frontend domain numbers. Frontend booleans remain `boolean`, while FormData writes use the shared `0 | 1` API convention as text values.

Delivery duration is one required, non-localized numeric value in the UI and domain model. The API boundary reads and writes the single canonical `delivery_duration` key. Finite floating-point values are accepted. No unit, integer-only rule, non-negative rule, minimum, or maximum is assumed without backend confirmation.

Branch pickup is identified by `is_pickup`, not by price. Enabling pickup sets and sends `price = 0`; disabling pickup leaves the current zero price editable and does not restore hidden state.

There is no Show endpoint. The paginated Index response contains the complete editable contract, so Edit is intentionally row-backed and does not issue a detail request. Search and filters are not supported and are not rendered.

Current required-text, finite delivery-duration, non-negative finite-price, optional integer-sort-order, and pickup zero-price rules are defensive frontend validation decisions. Additional backend validation, including code uniqueness, has not been confirmed.
