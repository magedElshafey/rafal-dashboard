# Shipping Methods backend integration notes

Shipping Methods is a paginated CRUD resource. The dashboard uses `GET /dashboard/shipping-methods`, `POST /dashboard/shipping-methods`, `PUT /dashboard/shipping-methods/:id`, and `DELETE /dashboard/shipping-methods/:id`. Create and Update use `multipart/form-data`; Delete has no request body.

Update is partial for every documented writable field. Omitted fields remain unchanged, so the frontend maps React Hook Form dirty fields to a dedicated partial domain payload before the service converts them to wire keys.

Omitting `sort_order` on Update keeps its existing value, and no clearing syntax is confirmed. Edit therefore prevents clearing an existing Sort Order as unsupported frontend behavior; `0` and negative integers remain valid. Create continues to allow Sort Order to be omitted.

API response prices are strings such as `"25.00"`; the service normalizes them to frontend domain numbers. Frontend booleans remain `boolean`, while FormData writes use the shared `0 | 1` API convention as text values.

Branch pickup is identified by `is_pickup`, not by price. Enabling pickup sets and sends `price = 0`; disabling pickup leaves the current zero price editable and does not restore hidden state.

There is no Show endpoint. The paginated Index response contains the complete editable contract, so Edit is intentionally row-backed and does not issue a detail request. Search and filters are not supported and are not rendered.

Current required-text, non-negative finite-price, optional integer-sort-order, and pickup zero-price rules are defensive frontend validation decisions. Additional backend validation, including code uniqueness, has not been confirmed.
