# Product Reviews backend integration notes

- Product Reviews uses paginated `GET /dashboard/reviews` with only the `page` parameter. Search, filter, and sort parameters are not supported.
- A non-empty Index response has not yet been observed. Index item normalization provisionally uses the confirmed Review shape returned by the moderation PATCH response and remains isolated at the service boundary.
- Confirmed statuses are `pending`, `approved`, and `rejected`. Dashboard transitions are limited to `pending -> approved` and `pending -> rejected`.
- Moderation uses JSON `PATCH /dashboard/reviews/:id` with exactly `{ "status": "approved" }` or `{ "status": "rejected" }` and invalidates only Review list queries after success.
- Rating accepts finite values from 1 through 5 inclusive, including floating values. Comment is required, and user/product objects are guaranteed non-null by contract.
- Review photos use the shared Product photo shape but are outside the current Product Reviews UI scope.
- Because there is no Review Show endpoint, every list item supports inline full-comment inspection. Moderation actions and confirmations identify the exact Review using reviewer and product context.
- There is no Review Show, Delete, or Admin Response endpoint or Dashboard workflow.
