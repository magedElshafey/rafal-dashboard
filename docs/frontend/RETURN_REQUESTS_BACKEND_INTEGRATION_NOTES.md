# Return Requests backend integration

Return Requests use the real backend through the established page/component → TanStack Query hook → service → shared `$http` flow. The Dashboard exposes lazy full-page Index and Detail routes; it does not provide create, edit, delete, refund, bulk, search, or filter behavior.

## Confirmed endpoints and transport

- `GET /dashboard/return-requests` returns the current page of requests plus `meta.current_page` and `meta.per_page`.
- `GET /dashboard/return-requests/:id` returns the canonical request detail.
- `POST /dashboard/return-requests/:id/approve` sends JSON `{ decision_note: string | null }`. A blank approval note is sent as `null`.
- `POST /dashboard/return-requests/:id/reject` sends JSON `{ decision_note: string }`; the trimmed note is required.
- These writes contain no media and never use `FormData` or multipart transport.

Pending responses may omit `decided_by_admin`; missing or null normalizes to `null`. User names may be blank and display falls back to email, then the localized unavailable label. `decision_note` and `decided_at` are nullable. Status and reason remain open strings: known values receive localized presentation and unknown nonempty values remain readable without affecting parsing.

Only canonical `pending` requests expose Approve and Reject actions. Approve has a confirmed full-entity success response and updates the exact detail cache before canonical refetch. Reject success entity data is unconfirmed, so a successful envelope remains successful without entity data; the exact Show is refetched and Return Requests lists are invalidated. Both mutations disable retry and duplicate submission. The related Order lifecycle is entirely backend-owned and Orders caches are not mutated here.

## Nullable comments

The confirmed read contract for `comment` is `string | null`. The raw schema and domain preserve `null` as `null`, including in the real Index fixture with request ID 1. Empty strings remain valid text; numbers, booleans, objects, and arrays are rejected. Index and Detail display the existing AR/EN localized unavailable label for null or blank comments, without fabricating backend content. Nonblank comments retain their text and the bounded Index preview.

## Backend-owned gaps

- A real successful Reject response body has not been supplied.
- Index pagination exposes only `current_page` and `per_page`; there is no authoritative total, last page, next page, or has-more signal. The frontend renders the returned page without inventing navigation.
- No Return Requests search or filter query parameters are documented, so no search or filter UI is present.
