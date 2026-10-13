# Return Requests backend integration

Return Requests use the real backend through the established page/component → TanStack Query hook → service → shared `$http` flow. The Dashboard exposes lazy full-page Index and Detail routes; it does not provide create, edit, delete, refund, bulk, search, or filter behavior.

## Confirmed endpoints and transport

- `GET /dashboard/return-requests` returns the current page of requests plus `meta.current_page` and `meta.per_page`.
- `GET /dashboard/return-requests/:id` returns the canonical request detail.
- `POST /dashboard/return-requests/:id/approve` sends JSON `{ decision_note: string | null }`. A blank approval note is sent as `null`.
- `POST /dashboard/return-requests/:id/reject` sends JSON `{ decision_note: string }`; the trimmed note is required.
- These writes contain no media and never use `FormData` or multipart transport.

Pending responses may omit `decided_by_admin`; missing or null normalizes to `null`. User names may be blank. In the workspace Customer card, the visible Name fact contains only the trimmed backend name and is omitted when blank; Email remains a separate fact. The View Customer accessible identity uses name → email → localized Customer #ID. Normalization preserves blank names, and other identity contexts retain their existing fallbacks. `decision_note` and `decided_at` are nullable. Status and reason remain open strings: known values receive localized presentation and unknown nonempty values remain readable without affecting parsing.

Only `approved` and `rejected` are presented as completed decisions with decision metadata. Unknown statuses remain read-only under Request status; their lifecycle shows Current status without implying a decision, actor or decision timestamp. Only `pending` exposes moderation actions.

Only canonical `pending` requests expose Approve and Reject actions. Approve cancels older exact Show requests and uses its confirmed full-entity response to update the detail cache without a redundant Show GET. Return Requests lists are invalidated; the related exact Order detail and Order lists are marked stale with `refetchType: 'none'`, without fetching or modifying Order entities. Reject success body data remains undocumented and is ignored: successful HTTP transport is accepted unless the envelope explicitly reports failure, then one exact Show refetch supplies the final state and Return Requests lists are invalidated. Reject does not invalidate Orders. Both mutations disable retry and duplicate submission.

The review workspace reuses the canonical detail route/query and performs one cold Show GET. Order and Customer context comes from that response, with numeric-ID deep links and no enrichment requests. Reason precedes decision controls on mobile. Pending review becomes a read-only decision summary with available actor/note/time; lifecycle uses only supplied timestamps. Shared section composition mirrors loading and loaded layouts. Canonical positive safe route IDs are required before mounting the query. Cached details and links survive background failures; decisions are disabled while refreshing, paused or errored, with a submission-time cache check protecting already-open dialogs.

## Nullable comments

The confirmed read contract for `comment` is `string | null`. The raw schema and domain preserve `null` as `null`, including in the real Index fixture with request ID 1. Empty strings remain valid text; numbers, booleans, objects, and arrays are rejected. Index and Detail display the existing AR/EN localized unavailable label for null or blank comments, without fabricating backend content. Nonblank comments retain their text and the bounded Index preview.

## Backend-owned gaps

- A real successful Reject response body has not been supplied.
- Index pagination exposes only `current_page` and `per_page`; there is no authoritative total, last page, next page, or has-more signal. The frontend renders the returned page without inventing navigation.
- No Return Requests search or filter query parameters are documented, so no search or filter UI is present.
