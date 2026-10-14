# BUG-020 — Warehouse-First Inventory

## Current architecture

The approved flow is **Inventory → Warehouse Directory → Warehouse Inventory Workspace → Stock Operations**.

- `/dashboard/inventory` is a warehouse selection directory, using the existing `useWarehouses` infinite query, warehouse service, cache keys and verified list pagination. It is not a second CRUD screen. Existing warehouse administration remains at `/dashboard/warehouses`.
- `/dashboard/warehouses/:id/inventory` loads Warehouse Show for identity, status and cities, then the separately scoped inventory collection. Invalid IDs and missing/mismatched warehouse identities never trigger inventory requests.
- The existing stock collection moved into `InventoryWorkspace`. `InventoryList`, `InventoryRecordCard`, `InventoryOverview`, Quick Stocktake and the Product stock mutation remain reused. No redundant all-stock route was added.

The directory uses shared DashboardPageHeader, DashboardCard, Badge, Button and Skeleton primitives. The existing warehouse list is a CRUD table/mobile composition with mandatory edit/delete callbacks, so it was not repurposed into a second administration flow. Directory cards show name, status and an accessible Open Inventory link. Warehouse Index does not expose cities in its verified normalized contract; the directory makes no per-card Show requests. Cities appear in the workspace from its single Warehouse Show request.

Warehouse menu and Product Details contextual actions now say Open Inventory and lead to functioning workspaces. All generated warehouse links omit a page query, so choosing another warehouse starts at page 1. A direct URL with an explicit valid page remains supported. Existing authenticated lazy routes and sidebar registration are preserved.

## Confirmed backend integration

The Product Owner's latest brief confirms both `warehouse_id` and `page` on `GET /dashboard/warehouse-stocks`. These capabilities are enabled.

```ts
inventoryService.list(6, 1, signal)
// $http.get({ url: '/dashboard/warehouse-stocks',
//   query: { warehouse_id: 6, page: 1 }, signal, ... })
// GET /dashboard/warehouse-stocks?warehouse_id=6&page=1

inventoryService.list(6, 2, signal)
// GET /dashboard/warehouse-stocks?warehouse_id=6&page=2
```

The shared HTTP abstraction serializes the query object. Both arguments must be positive safe integers before transport. No page-size, search, sort or status parameters are sent. The warehouse ID comes from the route, never a competing query parameter.

Zod parsing and existing attribute normalization preserve stock/product/variant/warehouse IDs, localized names, exact attribute keys, backend statuses, update timestamps and pagination metadata. Stock quantities remain non-negative safe integers with no clamping/coercion/rounding. The threshold retains its separate finite-number contract; an integer/non-negative range has not been confirmed for that configuration value.

After parsing, every stock record must match the requested warehouse. A mixed or wrong-warehouse response fails the entire request; it is never silently filtered or displayed under another warehouse. An in-range request whose response claims another page also fails rather than presenting unrequested data. Empty responses alone cannot prove server-side filtering or metadata scope; the confirmed contract and manual API verification remain the basis for interpreting filtered totals.

Inventory GET opts into the existing local 403 handling so the workspace retains its error/retry boundary. Existing authentication/401 handling is unchanged. Warehouse Show retains its established transport behavior.

## Pagination and cache ownership

The canonical inventory cache key is:

```ts
inventoryKeys.list(warehouseId, page)
// ['inventory', 'list', warehouseId, page]
```

Warehouse and page caches cannot collide. No previous-scope placeholder data, client-side slicing, product grouping or additional global inventory store is used. Leaving a scope cancels its read through the Query signal; late responses cannot appear in another warehouse.

The workspace uses the existing QueryProvider and PaginatedListFooter. Page clicks update URL history, retain the warehouse route and request the corresponding server page. The footer displays backend current/last/total metadata. Browser Back/Forward restores the explicit route/page context.

Malformed, zero, negative, fractional and unsafe page query values normalize to 1 using history replacement; no invalid request is emitted. For out-of-range responses containing valid metadata, the workspace replaces the URL with the returned valid page, or the returned last page when the response still echoes an out-of-range page, then fetches that page. This also handles a page disappearing after a mutation/refetch. A backend error without pagination metadata remains a recoverable error; no last-page number is guessed.

Page/warehouse transitions remount only the scoped workspace, clearing a departed stocktake draft and cancelling pending preflight reads. On a successful SET, the existing mutation cancels old inventory reads and invalidates the entire inventory query family; active pages refresh authoritatively. The exact Product Detail cache is updated/revalidated as before. The current warehouse/page URL remains unchanged when still valid. No optimistic inventory status or timestamp is invented.

Warehouse-directory pagination preserves the existing infinite-query/scroll pattern, adds a keyboard-accessible load-more action, and stops automatic retries after a next-page failure. It does not explicitly fetch all pages or every warehouse for a custom switcher. Requests are deduplicated during pending load-more operations.

## Quick Stocktake and data integrity

Quick Stocktake is the existing direct correction workflow:

1. Select a specific stock ID in the active warehouse; physical count starts blank.
2. Enter a non-negative safe integer; display localized shortage/surplus/no-change.
3. Review performs a fresh Product Show read, matching product, variant, warehouse and stock ID when available.
4. Changed balances update the baseline, retain the count and require review again. Missing/replaced stock blocks SET.
5. Explicit confirmation checks the balance again, then uses the existing absolute SET service. Recorded 100/count 93 submits `quantity: 93`, never `-7`. Zero remains valid; no-change does not write. No DELETE is used.
6. Submission locks prevent duplicate SET. Closing during preflight cancels it; closing during SET is blocked. Failed requests preserve the draft; 422 errors remain associated with the count/help text. Focus returns appropriately after errors/review/save.
7. Authoritative inventory refresh preserves scope/page where valid. If it fails, cached records remain visibly stale with retry feedback rather than fabricated balances.

Tests cover the same variant in warehouses 6 and 8, ensuring only the selected warehouse's quantity is submitted and its Product stock entry is replaced. Cached inventory pages remain separated and are invalidated through the shared family.

Balance preflights are **not atomic concurrency protection**. A change can occur between GET and SET. Product Show may omit stock IDs; in that case its product/variant/warehouse association is the strongest available check. A lost SET response leaves the outcome uncertain; retry revalidates first. Backend conditional-write/version support would be needed for stronger guarantees.

## UX, accessibility and loading

The workspace hierarchy is warehouse identity/status/cities, scoped overview, stock records and pagination. Overview values are server-reported stock-record total, current-page record count and threshold. They are not distinct-product counts, total units or physical-count summaries. The same product's variants remain separate stock records and may span pages.

The existing responsive stock cards retain product/variant identities, recorded quantity, backend status, timestamps, contextual links and Quick Stocktake. The warehouse label remains a small explicit identity check in each reusable card. The old unavailable/incomplete-pagination notices are removed.

Directory cards use one responsive DOM with six matching loading cards. Warehouse identity loading and subsequent stock loading reuse the same workspace skeleton, including 15 existing card skeletons matching the supplied default page size without sending an unconfirmed page-size parameter. Background fetches retain cached content. Empty warehouse, empty server page, missing warehouse and fetch failure have distinct states. A warehouse-wide empty message requires a successful filtered response with zero total.

English/Arabic, plural rules, logical spacing, bidirectional isolation, native keyboard controls, help/error relationships and focus behavior are retained. Skeletons, drawer transitions and loading spinners honor reduced motion. No visual, contrast, browser viewport, CLS or performance measurement is claimed.

## Changed files in this architecture phase

| File                                                              | Purpose                                                                                          |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/modules/inventory/pages/InventoryPage.tsx`                   | Warehouse directory using existing query and shared primitives                                   |
| `src/modules/inventory/components/InventoryWorkspace.tsx`         | Relocated stock collection, stocktake, active paging and metadata-based correction               |
| `src/modules/warehouses/pages/WarehouseInventoryPage.tsx`         | Warehouse identity/context, URL normalization and scoped workspace                               |
| `src/modules/inventory/api/inventory.service.ts`                  | Confirmed query serialization and warehouse/page response integrity                              |
| `src/modules/inventory/hooks/useInventory.ts`                     | Warehouse/page-specific cancellable query                                                        |
| `src/modules/inventory/queries/inventory.keys.ts`                 | Warehouse/page cache identity under existing inventory family                                    |
| `src/modules/inventory/utils/inventory-pagination.ts`             | Safe URL page reading and shared footer metadata adapter                                         |
| `src/modules/inventory/components/InventoryRecordCard.tsx`        | Remove obsolete warehouse-unavailable explanation                                                |
| `src/modules/inventory/locale/en.json`                            | Directory/workspace/scoped overview and functional navigation copy                               |
| `src/modules/inventory/locale/ar.json`                            | Equivalent Arabic copy and preserved plural rules                                                |
| `src/modules/inventory/__tests__/inventory.fixtures.ts`           | Synthetic warehouse/page-scoped fixtures                                                         |
| `src/modules/inventory/__tests__/inventory.service.test.ts`       | Parameters, cancellation, invalid inputs and scope/page mismatch tests                           |
| `src/modules/inventory/__tests__/InventoryPage.test.tsx`          | Directory cards, pagination/retry, loading/empty/error and Arabic                                |
| `src/modules/inventory/__tests__/WarehouseInventoryPage.test.tsx` | Scope isolation, URL history, correction, cancellation, errors and responsive skeleton structure |
| `src/modules/inventory/__tests__/inventory-navigation.test.tsx`   | Warehouse actions, management links, lazy routes and locale parity                               |
| `src/modules/inventory/__tests__/QuickStocktakeDrawer.test.tsx`   | Preserved workflow plus same-variant/different-warehouse target and page-preserving refresh      |
| `src/modules/products/hooks/product-variants.mutations.test.tsx`  | Existing inventory invalidation tests migrated to scoped keys                                    |
| `src/modules/products/pages/ProductDetailsPage.test.tsx`          | Updated functional warehouse link wording                                                        |
| `docs/frontend/INVENTORY_BACKEND_INTEGRATION_NOTES.md`            | Current architecture, confirmed contracts, limitations and QA                                    |

Existing implementation work outside this phase is preserved, including shared pagination/forms/drawer accessibility, Product stock services/mutations, stock validation, routing and locale registration. No dependency, backend, database, Odoo or authorization redesign is included.

## Remaining dependencies and risks

- Search, status/sort filters and adjustable page size remain unconfirmed and are not exposed as inventory controls.
- Effective administrator permission names/inheritance/revocation remain unconfirmed. The permission catalog and role names are not grants; backend decisions remain authoritative.
- Reservation/available-to-sell quantities, ledgers, stocktaking sessions/approvals and Odoo are outside this contract and implementation.
- Atomic conditional writes are not available. Existing preflight limitations remain.
- Live staging validation of filtered totals, last-page behavior and permission responses remains outstanding. No staging access was supplied or used; no production mutations were performed.

## Verification

Executed for the final implementation:

- Regression suite: **43 files, 492 tests passed**, using `vitest run --maxWorkers=1` across Inventory, Warehouses, Products, dashboard navigation, routes, shared pagination, entity drawers, query boundaries, FormWrapper/FormInput, Axios authentication and auth state. This includes the focused inventory and stocktake cases; it is not a claim that every repository test was run.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run lint`: passed repository-wide.
- `npm.cmd run build`: passed. Vite reports chunks larger than 500 kB in the main/map bundles; this change does not restructure those bundles.
- Prettier check on all changed/untracked source, locale and documentation files: passed.
- `git diff --check`: passed.

Logs are retained locally under `.artifacts/bug020-warehouse-{regression,typecheck,lint,build,format}.log`. Tests emitted React Router future-flag notices, a Product deletion test `act` environment notice and jsdom's unsupported document-navigation notice; all 492 assertions/tests completed successfully. An earlier broader UI-surface run identified an unrelated existing MultiSelect background-class expectation mismatch in `src/components/ui/form-control-surfaces.test.tsx`; that unchanged test was not included in this final scoped regression run and was not repaired here.

All automated tests use mocked services/transports and synthetic records. No browser E2E, live staging API, visual/contrast, accessibility measurement or CLS measurement was performed. No live production stock writes, dependency changes, commits or pushes were made.

## Focused manual QA

1. Open Inventory in English/Arabic, light/dark, desktop/tablet/narrow mobile. Check directory names/statuses, long names, skeletons, keyboard focus and load-more/retry. Confirm there are no invented warehouse KPIs or CRUD controls.
2. Open warehouse 6, verify identity/status/cities, then inspect the read-only staging request `GET /dashboard/warehouse-stocks?warehouse_id=6&page=1`. Compare every returned `warehouse.id` and the filtered metadata with the UI. Repeat for page 2 and warehouse 8; do not assume either warehouse shares a global total.
3. Navigate page 1 → 2 → 1 and browser Back/Forward. Switch warehouses from a later page and confirm the new workspace starts at page 1. Refresh a direct `?page=2` URL. Try malformed and out-of-range pages; inspect correction/error behavior without fetching every page.
4. Compare product/variant/SKU/attributes, quantity, backend status and timestamps with the selected response. Follow Product Details and its warehouse return link. Check zero-stock, unknown status, inactive data, empty page and empty warehouse separately.
5. With authorized non-production stock-write data only, count recorded 100 as 93, 107, 100 and 0. Confirm physical-count SET, explicit review, plural copy, scope/page retention, same-variant warehouse isolation and cache refresh. Change the backend balance before review/confirmation and confirm preserved draft/re-review.
6. Exercise identity 404/error, inventory 403/network/background failure, mismatched scope, SET 422/network failure, duplicate clicks and closing during preflight/SET. Check help/error announcements, retry, absence of false empty/success states and focus restoration. Confirm reduced motion and mobile keyboard behavior.
