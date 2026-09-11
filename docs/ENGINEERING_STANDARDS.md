# Frontend engineering standards

## Performance and requests

- Treat React Query as the server-state source; do not copy query data into component state.
- Keep URL filters in the URL, not duplicated state.
- Include every response-changing input in query keys and use `pageParam` for infinite pagination.
- Do not fetch all pages, card details, every filter combination, protected endpoints, meeting signatures, or analysis data speculatively.
- Prevent concurrent next-page requests and duplicate mutations.
- Memoize only when stable props or meaningful derivation make it useful. Isolate per-item pending state so one mutation does not rerender an entire list unnecessarily.
- Do not add polling or realtime infrastructure without an approved requirement.

## Mutation and cache policy

- Never use `window.location.reload`, route-remount tricks, cache clearing, or navigation loops to refresh data.
- Cancel affected queries and snapshot every cache that an optimistic update changes.
- Construct temporary entities only from known fields; never fake grades, files, timestamps beyond an explicit optimistic timestamp, or related IDs.
- Reconcile by API ID and defensively remove duplicates.
- Restore exact snapshots on error and preserve user-entered files/answers.
- Invalidate only specific changed keys. Use `refetchType: 'none'` when marking data stale must not issue an immediate GET.

## Accessibility

- Use one `h1` per resolved page and a logical heading hierarchy.
- Use semantic sections, labeled breadcrumbs, real links/buttons, and no nested interactive controls.
- Preserve keyboard operation, visible focus, tab semantics, and RTL arrow behavior.
- Expose disabled-action reasons through a focusable tooltip/wrapper; a disabled button alone cannot trigger a tooltip.
- Label form controls and connect descriptions/errors with `aria-describedby` and `aria-invalid`.
- Focus actionable error summaries or the first invalid field.
- Make upload selection, replacement, and removal keyboard accessible and expose file restrictions in text.
- Label progress bars and announce timers/loading without noisy live updates.
- Communicate status with text as well as color, hide decorative icons, and respect reduced-motion preferences.

## Responsive layout and CLS

Design for 320, 375, 390, 768, 1024, 1280, and 1440+ pixel widths. Avoid horizontal overflow; let grids collapse from three to two to one column, allow long names to wrap, and keep dates, tabs, file rows, upload controls, dialogs, and question navigation usable.

Use approximately 40-44px touch targets where practical. Directional spacing/icons must work in RTL. A loading skeleton must mirror the loaded page's breadcrumb, headings, cards, tabs, badges, actions, files, progress, timelines, and mobile stacking so controls do not jump when data arrives. Mark visual skeletons `aria-hidden` and provide one polite loading status.

## TypeScript and domain modeling

- Use explicit request/response/domain types and discriminated unions for status, type, and role branches.
- Do not use `any`, `@ts-ignore`, unsafe casts, or non-null assertions to hide invalid states.
- Avoid giant interfaces where unrelated fields are optional.
- Normalize untrusted boundary data with small pure helpers and keep unsupported values out of rendering/action code.
- Use API entity IDs, never array indexes, as React/domain identity.

## Reuse and maintainability

Inspect shared primitives before creating components. Share cohesive primitives or behavior used by real flows, not unrelated domain models. Keep services, mapping, routing decisions, templates, and interaction state in their appropriate layers. Remove dead code and commented-out prior implementations after confirming all consumers have migrated.

## Dates and time

Compose generic parsing, validation, formatting, localization, calendar comparison, and input helpers from `src/utils/date/date.helpers.ts`. Keep Exam windows, extension maxima, and due-badge decisions in domain-specific pure helpers.

Handle invalid values, timezone offsets, DST, and local calendar days. Do not emit `Invalid Date` or calculate calendar labels with naive millisecond-day division. Render timestamps with a valid ISO value in `<time dateTime="ISO-8601">`.

## File uploads

Use the existing upload components when they fit. Validate both extension and MIME type, enforce the exact approved size/count, expose restrictions before selection, allow replacement/removal, prevent duplicate submit, and keep the selected file after an API error.

For the current Assignment, Exam, and extension flows, the approved rule is one PDF up to 50 MB. Stale design labels mentioning DOCX, ZIP, JPG, 10 MB, or 20 MB must not appear.

## Error and state handling

Do not render blank pages. Initial failures need Retry; next-page failures preserve loaded content and retry only the failed page. Treat loading, empty, malformed data, missing files, not-found, forbidden, unavailable timing, and background refresh failure as distinct states. Forbidden states must not leak protected data before redirecting.

## Feature integration rules

- Treat the backend contract as authoritative when a design conflicts with it; do not guess roles, endpoints, routes, response fields, or filter keys.
- Protect role-specific features at both the route/deep-link boundary and the navigation/action boundary.
- Use the shared `$http` client with relative paths only.
- Use the project pagination and infinite-scroll hooks for paginated collections.
- Keep filter state in the route-aware Query Context and render filters through `FiltersWrapper`.
- `FiltersWrapper` supports search-only, drawer-only, and combined search-and-drawer compositions.
- Use `PortalLink` for portal navigation, `EntityFormDrawer` for entity forms, and the shared confirmation dialog for deletion.
- Reuse the DDL hooks/services and dependent group/subgroup controls instead of introducing feature-local option requests.
- Change shared code only through a backward-compatible API with focused regression tests.
- Invalidate the narrowest affected query and avoid reconciliation requests that do not change visible state.
- Every network-backed feature needs stable loading, empty, error, retry, success, and accessible states.
- Normalize backend transport typos or naming differences in boundary mappers rather than exposing them to UI models.
- Pre-filter shortcuts must use each destination module's established URL/Query Context key and remain visible, removable, and optional for direct access.
