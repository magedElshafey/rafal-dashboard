# Frontend architecture

All CRUD and paginated list modules MUST also follow [`frontend/CRUD_MODULE_CONVENTIONS.md`](frontend/CRUD_MODULE_CONVENTIONS.md). That document is the authoritative default for list states, mocks/services, infinite pagination, drawers, mutations, responsive data, actions, accessibility, and feature-level exceptions.

## Source layout

- `src/modules/<domain>` owns feature-specific pages, components, containers/hooks, services, types, schemas, constants, utilities, locales, and tests.
- `src/components/core` contains application-level primitives such as `Container`, `Section`, and `FormWrapper`.
- `src/components/shared` contains reusable dashboard, query-state, animation, notification, and related cross-feature components.
- `src/components/form` contains React Hook Form-aware controls and file-upload building blocks.
- `src/components/ui` contains lower-level shadcn/Radix-style primitives.
- `src/utils`, `src/hooks`, and `src/lib` contain infrastructure that is genuinely cross-domain.

Keep domain models inside their domain. A shared component is appropriate only when multiple real consumers have the same cohesive behavior.

## Routing

Top-level private routes live in `src/routes/privateRoutes`. `RequireAuth` protects authenticated routes and redirects unauthenticated requests to `/login`. Navigation uses React Router `Link`, `NavLink`, and `navigate` directly.

Required data must come from route parameters and canonical queries. Do not require `location.state` for refreshable detail/action pages. Shareable filters belong in URL search parameters and invalid values should be normalized with `replace`.

## Services and HTTP

Services are the only feature layer that calls project HTTP clients. `createHttpClient` supports typed GET/POST/PUT/PATCH/DELETE requests, cleaned query parameters, upload progress, multipart bodies, and `AbortSignal` cancellation.

Frontend/domain boolean state remains `boolean`. Laravel/API boolean writes use the shared serializer and the wire representation `0 | 1`; feature components do not repeat this conversion.

Service functions should:

- Model the approved endpoint contract explicitly.
- Return domain-ready data or call a pure mapper at the network boundary.
- Accept an `AbortSignal` for query cancellation when supported.
- Avoid navigation, component state, toast rendering, and query-cache manipulation.

## Query architecture

Feature query-key factories start with a stable domain prefix and include every input that changes returned data: role, status, type, entity ID, or filter. Infinite-query page numbers belong in `pageParam`, not in the cache key.

Components should render query data directly. Do not mirror server lists in local component or Zustand state. Flattened pages and derived displays may be memoized when the computation or stable child props justify it.

Mutations own cache cancellation, snapshots, optimistic changes, reconciliation, rollback, and targeted stale marking. Use TanStack Query v5 invalidation with `refetchType: 'none'` when the requirement is to mark data stale without an immediate GET.

When an endpoint explicitly guarantees partial updates, React Hook Form dirty state determines the changed domain fields and the feature service owns their wire-field conversion. Aggregate values such as a center coordinate or polygon boundary serialize atomically. Omission means unchanged only when the backend contract explicitly guarantees that semantic.

Feature-level TanStack Query hooks SHOULD be separated by independent use case and lifecycle, for example `useProducts`, `useProduct`, `useCreateProduct`, `useUpdateProduct`, and `useDeleteProduct`. Keep query-key factories separate and avoid a single query file that accumulates every query and mutation for a feature. This convention does not require splitting trivial utilities that do not have independent responsibilities.

Singleton resources such as Settings use focused detail-query and update hooks. They do not use generic CRUD, list, pagination, search, or filter abstractions.

Cross-domain invalidation is allowed only when a mutation changes a documented aggregate in another entity. For example, Create City invalidates City lists and Region lists because Region records expose `cities_count`.

## Forms

All standard application forms MUST use `src/components/core/FormWrapper.tsx`. Feature forms MUST NOT duplicate `FormProvider` or other React Hook Form provider wiring already owned by `FormWrapper` unless a documented technical exception requires it. `FormWrapper` remains infrastructure; schemas, validation messages, domain fields, and business mapping remain feature-owned.

Feature modules SHOULD compose React Hook Form-aware controls from `src/components/form/` and MUST NOT repeatedly rebuild an existing shared field from raw RHF and shadcn primitives. A business-specific field MAY compose shared primitives when no suitable generic field exists.

Shared form controls MUST use Rafal semantic design tokens and preserve light/dark themes, RTL/LTR direction, visible focus, hover, disabled, and error states. Form labels and required/error indicators use semantic foreground/destructive tokens; hardcoded colors and legacy product branding do not belong in shared form components.

Large or dynamic option sets backed by paginated endpoints SHOULD use an async/infinite select or multiselect rather than permanently rendering every option. Data fetching stays in a feature hook/service composition and the generic control receives options and paging behavior through props. Search MUST be enabled only when the backend contract supports it; do not invent search parameters or imply complete client-side search over partially loaded data.

### Geographic data

Shared geographic types belong in the shared type layer, not UI components. Geographic form editors remain API-agnostic and expose structured controls rather than raw JSON. Nullable geometry remains nullable unless the backend contract says otherwise, and feature services own transport conversion.

City geography uses a map-first editor: `CityForm` → `FormLocationMap` → `LocationMapEditor`. MapLibre GL JS renders the map, Terra Draw owns polygon drawing/editing, and OpenFreeMap currently supplies the Liberty style and tiles. The public style URL is configured through `VITE_MAP_STYLE_URL`; local development falls back centrally to the OpenFreeMap Liberty URL. City components do not contain provider-specific logic.

The domain and React Hook Form state remain `Coordinate` / `Coordinate[]`. GeoJSON exists only inside the map adapter, where longitude/latitude order and polygon ring closure are converted explicitly. The Laravel City payload is unchanged. Exact coordinate inputs remain available as a collapsed, synchronized accessibility and power-user fallback.

### Multi-value string fields

User-editable `string[]` fields use the shared tags/multi-value form primitive. The shared primitive owns adding, removing, trimming, exact-duplicate prevention, keyboard behavior, disabled state, and basic input limits; the feature schema owns domain validation. UI components do not serialize arrays: the feature service owns request transport encoding. This convention does not apply to remote entity selection such as roles, permissions, or categories, which continues to use async select or multiselect controls.

Validation schemas remain domain-specific, expose accessible descriptions/errors, and should not validate an entire form on every keystroke without a product reason.

### Sort order fields

Entities with an explicit `sort_order`, `order`, or `position` contract use the shared `FormSortOrder` field. The primitive owns numeric input presentation, form integration, direction, and reusable min/max/step behavior. Feature schemas own the exact integer, range, and required rules.

### File and image fields

Image selection uses the shared controlled `ImageUploader` primitive and its `FormImageUploader` adapter. The same primitive supports configurable single and multiple modes, typed remote images and local `File` values, replacement/removal callbacks, type/count/size/dimension validation, and non-distorting previews. Object URLs must be revoked after replacement, removal, and unmount. Large local collections stay inside a constrained responsive preview surface.

Remote API media remains a remote entity and MUST NOT be converted into a fake `File`. A feature service owns multipart serialization, while feature/API contracts own the meaning of replacing or removing existing media. Image controls must preserve native file selection, keyboard access, semantic errors, RTL/LTR direction, and light/dark semantic tokens.

## Components and pages

Pages coordinate route/auth/query state. Templates render loaded domain data. Smaller components own cohesive visual or interaction responsibilities. Reuse `Container`, `Section`, Dashboard cards/stat cards, segmented tabs, status badges, breadcrumbs, query states, file rows, buttons, and skeleton primitives before introducing new variants.

Every asynchronous page needs explicit initial loading, initial error/retry, success/empty, background error, and applicable forbidden/not-found states. Structurally different pages receive structurally matching skeletons.

## Types and imports

Use explicit domain types and discriminated unions for state/type/role-dependent responses. Avoid `any`, hidden non-null assumptions, and giant interfaces made entirely of optional fields. The `@/` alias maps to `src`; use it for cross-directory imports and nearby relative imports only when that is the established local convention.

## Localization

Feature locales live next to their modules and are merged in `src/lang/resources.ts`. All visible strings and accessible names use i18next keys, interpolation, and pluralization. Do not concatenate translated fragments.
