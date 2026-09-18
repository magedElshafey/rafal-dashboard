# Regions backend integration notes

The Regions UI implements the documented index, create, update, and delete contracts. The index row contains every currently editable field, so Edit intentionally uses that row until a show endpoint is documented. Create responses that omit `cities_count` are normalized to `0` at the service boundary.

Confirmed writable fields are `name[ar]`, `name[en]`, optional `code`, optional `sort_order`, and `is_active`. Empty code and sort-order values are omitted; numeric sort order `0` remains valid and is submitted. `DELETE /dashboard/regions/:id` sends no request body.

Pending backend confirmations:

1. Does `GET /dashboard/regions/:id` exist?
2. Is deletion blocked when `cities_count > 0`, and which domain status/payload represents that rejection?

Until confirmed, Edit remains row-backed and city-count deletion rules remain server-authoritative.
