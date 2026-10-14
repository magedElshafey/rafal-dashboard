# Roles and grouped permissions integration

## Audit and confirmed compatibility gaps

- The previous permission DTO was a flat `{ id, name }[]` with mandatory pagination metadata. Its service sent `page`, adapted `meta`, and used an infinite query. The new grouped, nonpaginated response would fail at that adapter. The picker also used raw permission names and had no backend labels or group controls.
- The committed Roles workflow uses GET/POST `/dashboard/roles`, GET/PUT/DELETE `/dashboard/roles/:id`. List pagination stays unchanged. Create/Update encode `name` and repeated `permissions[]` as URLSearchParams. Assigned permissions in list/detail/mutation responses are `string[]`. This is existing repository evidence, not independent verification of the migrated live backend.
- There is no separate Role Details screen or route. The Edit drawer fetches Role Show before initializing the form; the list displays a compact assignment summary. This migration preserves those workflows.
- Existing mutations own localized notifications, narrow list invalidation, authoritative detail-cache updates after Edit, and detail removal after Delete. The form requires at least one selected permission. These behaviors are unchanged.
- AuthAdmin/login/session contain identity and role names, but no granular permission names. RequireAuth checks authentication only. Navigation and action controls have no existing granular authorization abstraction. Role names, including “Super Admin”, are not verified permission grants.

The supplied attachment contains an illustrative Products group, examples of exact operation names, and the stated 19-group/65-permission count. It does **not** include the complete production response. The implementation is dynamic; the 19/65 scale fixture is explicitly synthetic, not a reconstruction of production permissions.

## Implemented contract

GET `/dashboard/permissions` is one cancellable shared-HTTP request without page parameters. Runtime Zod validation preserves group order, permission order, IDs, exact names, group identifiers, and localized labels. Malformed envelopes, IDs, duplicate group/permission identities and inconsistent group membership reject the catalog. Missing translations are allowed for display fallback; wrong label types are rejected. No permission identifiers are generated or normalized.

The TanStack Query namespace remains `permissions`; the list key now ends in `grouped` to prevent reuse of the old infinite-query cache shape. Roles query keys and mutation invalidations are unchanged. No permissions lookup is made per role or per checkbox.

The existing form now presents named groups with individual checkboxes, group Select All/Deselect All, a mixed checkbox state and selected counts. It uses the shared checkbox, button and skeleton primitives with React Hook Form as the only draft owner. Group changes affect only that group's exact names. Backend label preference follows AR/EN, then the other translation, then the exact identifier. Labels are escaped text, with bidirectional isolation and RTL layout.

Role Create/Update still submit permission **names**, never catalog IDs. Indexed 422 fields such as `permissions.0` and `permissions[0]` map to the permission field. A synchronous form submission lock prevents duplicate mutations from rapid clicks. The form no longer mounts while its drawer is closed, preventing a redundant catalog request during close. Pending controls, error feedback and create-another reset remain.

An assignment absent from the loaded catalog stays in the form and is shown in “Other assigned permissions”. It is not silently removed, automatically mapped to a new name or offered as a new assignable option. Group deselection leaves it untouched. Name-only edits preserve all original assignments even if the catalog is empty or cannot load. The existing name-array write contract supports resubmitting those strings; whether the migrated backend still accepts each retired identifier is unresolved. Backend rejections retain the draft. Explicit removal/migration of unknown permissions needs backend policy.

## Authorization boundary and remaining dependencies

No auth state, token storage, route guard, sidebar, shared HTTP behavior or super-admin exception was changed. The permission catalog describes assignable permissions; it is **not** the current administrator's effective access.

Existing shared Axios behavior rejects 403 and redirects to /403 without clearing the session. The documented own-role Delete 403 remains handled locally. The backend remains authoritative. Dashboard-wide client authorization is **not complete**.

Backend evidence still needed:

1. Authenticated-admin effective permission names, role inheritance/super-admin rules, refresh/revocation behavior and action/route policy, before implementing granular frontend enforcement.
2. Current Role Create/Update/Show success examples confirming the existing name-array contract remains unchanged, including handling of retired assignments.
3. The complete production catalog for integration comparison. No implementation behavior depends on the stated group/permission counts.

## Changed files

All source paths below are under `src/modules/roles/`:

- Data layer: `api/permissions.service.ts`, `hooks/usePermissions.ts`, `queries/permissions.keys.ts`, `schemas/permission.schema.ts`, `types/permission.types.ts`.
- Form UI: `components/RoleForm.tsx`, `components/RoleDrawer.tsx`, new `components/RolePermissionSelector.tsx`, new `utils/permission-label.ts`, `locale/ar.json`, `locale/en.json`.
- Tests/fixtures: `api/permissions.service.test.ts`, `api/roles.service.test.ts`, `pages/RolesPage.test.tsx`, `queries/permissions.keys.test.ts`, new `locale/roles-locales.test.ts`, new `fixtures/permissions.fixture.ts`.
- Integration documentation: this file.

## Verification

- Final Roles + authentication/routes/shared-form regressions: **77 passed, 0 failed, 0 skipped across 12 files** (54 Roles tests and 23 directly related regressions).
- Command: `yarn vitest run src/modules/roles src/store/auth.test.ts src/config/axios.auth-boundary.test.ts src/routes/routes.test.tsx src/modules/auth/service/login.service.test.ts src/components/core/FormWrapper.test.tsx --maxWorkers=2 --minWorkers=1`.
- TypeScript: `yarn typecheck` passed; the final `yarn build` also passed its TypeScript compilation and Vite production build.
- Repository-wide `yarn lint` passed. Changed-file Prettier and `git diff --check` passed, including separate whitespace checks for new files.
- Build reported chunks above 500 kB (main bundle and location-map chunks); no bundling changes were made. Tests emitted React Router future-flag warnings and the existing jsdom navigation limitation during the 401 redirect test; those tests passed.
- Two failing race regressions were fixed before the final successful run: duplicate submit and a catalog refetch on drawer close.
- Diff review found no remaining correctness issues in this scoped change. All code changes are inside Roles; shared auth, HTTP, routes, and unrelated modules are unchanged. Browser and live backend verification were not performed.

## Manual smoke test for QA

1. Open Create Role in EN and AR. Verify all returned groups, labels and non-CRUD actions, keyboard selection, RTL layout and mobile wrapping.
2. Select one permission: its group becomes mixed. Select/deselect the group: other groups remain unchanged. Save and inspect exact `permissions[]` names.
3. Open Edit: compare selected names with Role Show. Rename only and confirm all assignments remain. Check an unknown assignment remains visible and is not removed by group actions.
4. Exercise loading, empty catalog, retry, 422 and 403 responses. Failed submissions retain the draft; repeated clicks while pending send one mutation.
5. Verify Create Another resets selections; Edit refreshes list/detail; Delete requires confirmation and handles the own-role 403.
6. With backend-authorized test accounts, verify direct API and deep-link denials. Client action hiding remains dependent on the missing effective-permissions contract.

No browser verification or live API calls were performed. No backend, Storefront, dependency, authentication-storage, commit or push changes are part of this migration.
