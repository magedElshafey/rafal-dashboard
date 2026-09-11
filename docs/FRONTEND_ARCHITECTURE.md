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

Service functions should:

- Model the approved endpoint contract explicitly.
- Return domain-ready data or call a pure mapper at the network boundary.
- Accept an `AbortSignal` for query cancellation when supported.
- Avoid navigation, component state, toast rendering, and query-cache manipulation.

## Query architecture

Feature query-key factories start with a stable domain prefix and include every input that changes returned data: role, status, type, entity ID, or filter. Infinite-query page numbers belong in `pageParam`, not in the cache key.

Components should render query data directly. Do not mirror server lists in local component or Zustand state. Flattened pages and derived displays may be memoized when the computation or stable child props justify it.

Mutations own cache cancellation, snapshots, optimistic changes, reconciliation, rollback, and targeted stale marking. Use TanStack Query v5 invalidation with `refetchType: 'none'` when the requirement is to mark data stale without an immediate GET.

## Forms

The repository provides `FormWrapper`, React Hook Form-aware inputs, Yup integration, date controls, and file-upload components. Prefer these components when they satisfy the required interaction. Validation schemas remain domain-specific, expose accessible descriptions/errors, and should not validate an entire form on every keystroke without a product reason.

## Components and pages

Pages coordinate route/auth/query state. Templates render loaded domain data. Smaller components own cohesive visual or interaction responsibilities. Reuse `Container`, `Section`, Dashboard cards/stat cards, segmented tabs, status badges, breadcrumbs, query states, file rows, buttons, and skeleton primitives before introducing new variants.

Every asynchronous page needs explicit initial loading, initial error/retry, success/empty, background error, and applicable forbidden/not-found states. Structurally different pages receive structurally matching skeletons.

## Types and imports

Use explicit domain types and discriminated unions for state/type/role-dependent responses. Avoid `any`, hidden non-null assumptions, and giant interfaces made entirely of optional fields. The `@/` alias maps to `src`; use it for cross-directory imports and nearby relative imports only when that is the established local convention.

## Localization

Feature locales live next to their modules and are merged in `src/lang/resources.ts`. All visible strings and accessible names use i18next keys, interpolation, and pluralization. Do not concatenate translated fragments.
