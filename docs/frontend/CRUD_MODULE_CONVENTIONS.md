# CRUD and list module conventions

This document is the default engineering contract for every Rafal Dashboard CRUD or paginated list module. A feature specification may override a rule only through the exception process at the end of this document.

## Module boundaries and data sources

The dependency direction MUST remain:

```text
page/component -> feature query or mutation hook -> feature service -> shared HTTP/data boundary -> active data source
```

- Components MUST NOT call `$http`, Axios, mock handlers, or mock arrays directly.
- Feature hooks MUST use TanStack Query for server state and MUST call feature services.
- Services MUST model the documented Laravel request and response contracts. Transport-to-domain mapping MUST happen at the service boundary or in a pure mapper called by it.
- Mock and real implementations MUST expose the same service contract. Selecting the active implementation MAY happen in a feature service composition file or shared mock transport, but MUST NOT affect feature UI code or query keys.
- Mock responses MUST preserve documented status, pagination, error, and entity shapes. Mock-only fields MUST NOT leak into domain/UI models.
- Replacing a mock source with Laravel MUST require no component changes and SHOULD require only service/data-boundary configuration changes.
- Secrets, credentials, tokens, and raw protected payloads MUST NOT be logged or persisted.

## Page header

- Standard dashboard module and index pages MUST use `DashboardPageHeader` from `src/components/shared/dashboard/atoms/DashboardPageHeader`.
- Features MUST provide translated page titles, optional introductory/description content, and page-level actions through the component's composition props.
- The `actions` slot MAY contain the authorized primary action and additional page-level actions. Business rules, permissions, navigation, and mutation logic MUST remain in the feature.
- Feature modules MUST NOT duplicate page-header spacing, typography, action alignment, or responsive behavior.
- A page MAY use a different header only for a clearly exceptional layout, and the reason MUST follow the exception process in this document.

## Standard list state model

Every network-backed list MUST distinguish:

1. initial loading with no data;
2. success with data;
3. success with no entities;
4. initial query error;
5. background/refetch error while retaining data;
6. incremental next-page loading;
7. next-page error while retaining data; and
8. empty search/filter results when filters are applicable.

`QueryStateBoundary` MUST own initial loading, offline, initial error/retry, and background-error presentation. A feature MUST derive `hasData` from all loaded pages, not only the latest page. Existing data MUST remain visible during background and next-page failures.

## Loading and skeletons

- A list MUST use `src/components/ui/skeleton.tsx`; a centered spinner MUST NOT be its primary initial-loading UI.
- The feature MUST compose a specific skeleton that approximately mirrors its loaded table columns, row count, card fields, actions, and major dimensions.
- Desktop table skeletons and mobile card skeletons MUST follow the same responsive breakpoints as their loaded equivalents.
- Visual skeletons MUST be `aria-hidden`. The containing loading state MUST expose one polite status and `aria-busy="true"`; `QueryLoadingState` supplies this contract.
- Skeletons SHOULD keep headers, filters, and stable containers mounted when those elements exist in the loaded state.
- A universal configuration-driven skeleton MUST NOT replace feature-specific structure. A small repeated row/card helper MAY be created when it materially reduces duplication.
- Drawer detail loading MUST use `EntityFormDrawer`'s form-like default skeleton or a feature-supplied `loadingContent` that mirrors the actual fields.

## Empty states

- All full-list and filtered-empty presentation MUST use `EmptyState` from `src/components/shared/empty-state`.
- The feature MUST provide translated `title` and, when useful, `description` content.
- The optional icon MUST be decorative; essential meaning MUST remain in text.
- A no-entities state SHOULD offer the primary create action when the user is authorized.
- A filtered-empty state SHOULD offer a clear/reset action and MUST NOT imply that the collection itself is empty.
- `variant="compact"` MAY be used inside constrained panels; the full variant is the default.
- Feature-specific copy, permissions, and actions MUST NOT be embedded in the shared component.

## Error states

- Query/list failures MUST use `QueryStateBoundary` and its shared `QueryStateNotice` presentation.
- Initial errors MUST replace the data surface and offer Retry. Refetch errors MUST retain existing data and render the inline notice.
- Retry MUST call the affected query's `refetch` or failed next-page operation only; it MUST NOT reload the page.
- User-facing text MUST be translated and safe. Raw database, stack, request, and backend error text MUST NOT be rendered.
- Technical context MAY be exposed in development-only diagnostics outside the user-facing message, provided it contains no secrets or protected data.
- Not-found, forbidden, validation, and offline states MUST remain distinct when the API contract distinguishes them.

## Search and filters

- Every index/list module MUST expose only the search and filtering capabilities supported by its backend/API contract.
- When the endpoint supports search, the feature MUST render search through `FiltersWrapper`. When it supports structured filters, the feature MUST render those controls through `FiltersWrapper` and its filter drawer. When it supports both, the feature MUST compose both through the same wrapper.
- When the endpoint supports neither search nor filtering, the feature MUST NOT render either control.
- A feature MUST NOT invent undocumented query parameters such as `search`, `q`, `keyword`, or `filter`. Visual consistency does not justify unsupported API behavior.
- Client-side search or filtering MAY be implemented only when it is valid for the complete available dataset and is explicitly documented as a feature exception. It MUST NOT misrepresent filtering across partially loaded or paginated server data.
- Supported search/filter values MUST use URL-backed Query Context state when they affect a shareable list.
- The feature MUST define only documented query names and MUST include every supported response-changing value in its query key.
- Supported search SHOULD be debounced through the existing `SearchFilter` behavior. Trimming and removal of empty values MUST remain consistent.
- Applying, resetting, or changing a query MUST reset pagination to its initial page. Stale results from the old filter set MUST NOT be appended.
- Filter controls, labels, placeholders, drawer copy, and reset/apply actions MUST be translated.
- Standalone feature search shells MUST NOT be introduced without a documented UX exception.
- The currently documented Roles index endpoint does not support search, so the future Roles page MUST NOT render a search box unless that backend contract changes.

## Infinite pagination

- Normal CRUD lists MUST use `useInfinitePaginatedQuery` and `useInfiniteScroll`; numbered pagination MUST NOT be introduced unless product requirements explicitly require it.
- The query key MUST contain filters and other response-changing inputs. Page numbers MUST remain in `pageParam`.
- The service query function MUST accept and forward `AbortSignal` where supported.
- The sentinel MUST be enabled only when a next page exists and no next-page request is pending, for example `hasNextPage && !isFetchingNextPage`.
- A feature MUST flatten all loaded `pages[].items` into one derived collection without copying it into local or global state.
- The backend pagination contract determines the next page. Fetching MUST stop when `total_pages` is reached or `next_page_url` is absent.
- Duplicate concurrent next-page calls MUST be prevented. A changed filter/query generation MUST not inherit an earlier operation lock.
- Incremental loading MUST preserve current rows/cards and render a shape-appropriate loading-more affordance near the sentinel.
- A next-page error MUST preserve loaded items and provide a retry for the failed page.

## Responsive data presentation

- A normal index MUST use one query and one flattened item collection for all viewports.
- `ResponsiveDataLayout` MUST coordinate the stable header and loading/empty/data slots.
- `ResponsiveDataDesktop` with `ResponsiveDataTable` MUST provide the large-screen table.
- `ResponsiveDataMobileCards` with `ResponsiveDataMobileCard` MUST provide the small-screen cards.
- `TableProvider` MAY provide controlled table context, but it MUST receive caller-owned `data`, `serverData`, `isLoading`, and `refetch`; it MUST NOT fetch an endpoint.
- Desktop and mobile representations MUST expose equivalent important data and authorized actions, adjusted only for available space.
- Long content MUST wrap or scroll inside its own semantic container. It MUST NOT create document-level horizontal overflow.
- Rows and cards MUST use API entity IDs, never array indexes, as identity.

## Entity actions

- Table action cells and mobile cards MUST use `DashboardCardActions`.
- Each action MUST have a stable ID, translated visible label, accessible label when extra entity context is needed, and the correct semantic variant.
- Delete actions MUST use the destructive variant. Pending actions MUST set `isLoading`; unavailable actions MUST set `disabled` or be omitted based on the permission/UX requirement.
- A direct single action MAY use automatic trigger mode. Multiple actions, or a deliberately consistent action column, SHOULD use menu mode.
- Tooltips or `title` text MAY supplement an accessible name but MUST NOT be the only source of essential action meaning.
- A feature MUST NOT invent independent edit/delete icon styling.

## Create flow

- Standard creation MUST open in `EntityFormDrawer` in `create` mode.
- Create forms MUST use React Hook Form with a feature-owned Yup schema and initial values.
- The drawer MUST expose both translated actions: Create and Create & Create Another. `createAnotherLabel` enables the second shared submit button.
- For a form-associated drawer, the form submit handler MUST inspect the submitter's `data-submit-intent` (`create` or `create-another`) and run validation once through React Hook Form.
- Both actions MUST be disabled while loading, invalid when the chosen validation mode requires it, or mutation-pending. Duplicate mutations MUST be prevented.
- After successful Create, the mutation lifecycle MUST update or narrowly invalidate the affected list, show the standard success feedback when applicable, reset successful form values, and close the drawer.
- After successful Create & Create Another, it MUST update the same query state, keep the drawer open, call `reset(initialValues)` to clear values/errors/dirty state, and focus or prepare the first field.
- Values from the created entity MUST NOT carry over unless the feature explicitly documents intentional carry-over.
- Failed submissions MUST keep the drawer open and preserve user input.

## Edit flow and dirty state

- Standard editing MUST use `EntityFormDrawer` in `edit` mode.
- Opening Edit MUST identify the entity and display its current complete values before editing.
- Cached list data MAY seed or satisfy the edit form only when it contains the complete edit contract. Otherwise the feature MUST issue a detail/show query.
- Detail loading MUST use the drawer loading state and form-shaped skeleton. Detail failure MUST use a user-safe error with Retry inside the drawer.
- The Update button MUST be disabled while detail data is loading, the mutation is pending, or `formState.isDirty` is false.
- A pristine form MUST NOT send an update request. Features MUST NOT duplicate manual `JSON.stringify` comparisons.
- After success, the feature MUST call `reset(successfulValues)` so the new server values become the pristine baseline, then apply its documented close behavior.
- Server validation errors SHOULD map to fields when the contract permits; other safe errors SHOULD use the standard feedback/error surface.

## Delete flow

- Every destructive delete MUST open `DeleteAlert`; `confirm()`, immediate deletion, and feature-specific confirmation dialogs are forbidden.
- The title/body MUST be translated and identify the affected entity or consequence without exposing protected data.
- Cancel MUST close without mutation. Confirm alone MAY start the delete mutation.
- Pending state MUST disable confirm/cancel and prevent Escape or outside dismissal. Duplicate deletion MUST be prevented.
- On success, the mutation MUST remove/reconcile the entity safely or narrowly invalidate the affected list, then call the dialog ref's `close()`.
- On failure, the dialog SHOULD remain open and show safe feedback so the user can retry or cancel.

## Query and mutation ownership

- TanStack Query MUST own remote list and detail state. Zustand and ad hoc global stores MUST NOT mirror it without a documented architectural reason.
- Each feature MUST define a stable query-key factory for list and detail keys.
- Mutations MUST cancel/snapshot/rollback every cache they optimistically change and reconcile by API ID.
- Targeted cache updates SHOULD be used when safe and simple; otherwise invalidate the narrowest correct key.
- Global cache clears, broad unrelated invalidation, page reloads, and extra reconciliation requests MUST NOT be used.
- Create, update, and delete pending state MUST be scoped so unrelated entity actions remain usable where safe.
- Independent feature queries and mutations SHOULD live in focused hook files by use case, such as `useProducts`, `useProduct`, `useCreateProduct`, `useUpdateProduct`, and `useDeleteProduct`. Query-key factories remain separate. Avoid feature query files that grow to own every independent lifecycle; trivial utilities do not need one-file-per-function treatment.

## Forms and shared drawer responsibilities

- Standard application forms MUST use `src/components/core/FormWrapper.tsx`; feature forms MUST NOT duplicate `FormProvider` or React Hook Form provider infrastructure without a documented technical exception.
- Feature fields SHOULD use the shared React Hook Form-aware components in `src/components/form/`. Features MUST NOT repeatedly rebuild an existing shared field from raw RHF and shadcn primitives. Business-specific fields MAY compose shared primitives when no generic field is suitable.
- Shared form primitives MUST use Rafal semantic tokens and support light/dark themes, RTL/LTR, visible focus, hover, disabled, required, and error states. Hardcoded colors and legacy product branding are forbidden in shared form components.
- Shared drawer responsibilities are layout, focus-managed sheet lifecycle, loading/error slots, submit buttons, pending guards, and responsive presentation.
- Feature form responsibilities are fields, initial values, Yup schema, mapping, dirty state, validation errors, reset behavior, and focus after reset.
- Feature mutation hooks own API calls, cache lifecycle, success/error feedback, and post-success drawer decisions.
- Domain validation, endpoint fields, and entity mapping MUST NOT be added to `EntityFormDrawer`.

## Remote option fields

- Large or dynamic option sets from paginated endpoints MUST use a scalable async/infinite selection control instead of rendering the full catalog permanently.
- The feature query/service layer owns data fetching and pagination. Generic form controls receive option data, loading/error state, and load/retry callbacks through props and MUST NOT call feature APIs or TanStack Query directly.
- Initial loading, loading more, end-of-list, empty, and recoverable error states MUST remain visible within the field without blocking unrelated form fields.
- Selected values SHOULD remain compact while all selections stay inspectable when the control opens.
- Search MUST be enabled only when the backend contract documents a search parameter. Client filtering over partially loaded paginated data MUST NOT be presented as complete remote search.

## Localization, RTL, and accessibility

- Arabic is the default locale and English is secondary. Every visible string and accessible name MUST use i18n or be supplied as translated feature content.
- Layout, drawers, menus, actions, tables, cards, and skeletons MUST work in RTL and LTR without duplicating data/state trees.
- Actions MUST be real buttons or links. Dialog and drawer focus management MUST remain delegated to the existing Radix primitives.
- Controls MUST be keyboard operable and have visible focus. Disabled reasons MUST be exposed accessibly when users need to understand them.
- Loading MUST use appropriate `aria-busy`/status semantics without noisy announcements. Errors MUST use the established alert/status semantics.
- Form labels, descriptions, and errors MUST be programmatically associated with their controls.
- Color and tooltips MUST NOT be the sole carriers of meaning.

## Testing requirements

Each feature MUST add focused observable-behavior tests covering applicable cases:

- initial skeleton, loaded data, no entities, and filtered-empty copy/actions;
- initial error Retry, retained data on refetch/next-page error, and loading-more state;
- query-key/filter separation and pagination reset when supported, plus next-page stop and duplicate-load prevention;
- one shared data source feeding desktop table and mobile cards;
- translated accessible action names and permission/disabled behavior;
- Create closing after success and Create & Create Another remaining open with a clean reset form;
- Edit detail loading/error, populated values, pristine submit disabled, dirty submit enabled, and post-success dirty reset;
- delete requiring confirmation and blocking duplicate pending requests;
- narrow cache updates/invalidation and rollback when optimistic behavior is used; and
- important Arabic/English and RTL behavior.

Tests MUST assert behavior rather than snapshots alone. Shared component changes MUST include focused regression tests. Validation MUST follow `docs/TESTING_AND_VALIDATION.md`.

## Exceptions

These conventions are defaults, not immutable product laws. A module MAY deviate only when a product/BRD/API constraint requires it or the UX clearly benefits, and only when the exception is intentional.

The feature implementation MUST document a small exception beside the relevant composition. A significant or cross-feature exception MUST be recorded in an ADR or technical note. The note MUST state the constraint, chosen behavior, trade-off, and why the standard pattern is insufficient. Modules MUST NOT silently diverge.
