# Settings backend integration notes

Settings is a singleton resource. The dashboard reads it with `GET /dashboard/settings` and updates it with `PUT /dashboard/settings` using `application/json`. There are no Create, Delete, pagination, search, filter, or table behaviors.

Settings uses the real backend exclusively through the shared HTTP client. The former frontend mock mode and its environment flag have been removed.

The update endpoint supports partial updates: an omitted field is unchanged. The response object and its documented fields are authoritative; `free_shipping_threshold` is the confirmed nullable field, while missing response data is treated as unavailable rather than replaced with frontend defaults.

Frontend/domain booleans are `boolean`. API boolean writes use `0 | 1` through the shared serializer. API responses are normalized defensively from either booleans or `0 | 1` at the service boundary.

Turning Free Shipping off sends `free_shipping_enabled: 0` and `free_shipping_threshold: null`. Its threshold is optional while enabled. Turning Gift Wrap off sends `gift_wrap_enabled: 0` and `gift_wrap_fee: 0`; its fee is optional while enabled. Enabling either feature does not require or send its dependent value unless that value was changed or provided.

Current validation is defensive frontend behavior, not a backend guarantee: VAT is required and within 0–100; provided thresholds and fees are non-negative; address and cart limits are required integers of at least 1; OTP cooldown is a required non-negative integer. Guest-order verification minutes, low-stock threshold, and return-window days are required integers without additional invented ranges.
