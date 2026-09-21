# Settings backend integration notes

Settings is a singleton resource. The dashboard reads it with `GET /dashboard/settings` and updates it with `PUT /dashboard/settings` using `application/json`. There are no Create, Delete, pagination, search, filter, or table behaviors.

The update endpoint supports partial updates: an omitted field is unchanged. Every returned setting must have a value; missing or null response data is treated as unavailable rather than replaced with frontend defaults.

Frontend/domain booleans are `boolean`. API boolean writes use `0 | 1` through the shared serializer. API responses are normalized defensively from either booleans or `0 | 1` at the service boundary.

Turning Free Shipping off sets `free_shipping_enabled` and `free_shipping_threshold` to `0`. Turning Gift Wrap off sets `gift_wrap_enabled` and `gift_wrap_fee` to `0`. Re-enabling either feature does not restore a previous hidden value.

Current validation is defensive frontend behavior, not a backend guarantee: VAT is required and within 0–100; thresholds and fees are required and non-negative; address and cart limits are required integers of at least 1; OTP cooldown is a required non-negative integer. The backend has not specified additional business limits.
