# Customers backend integration notes

- Customer Index uses paginated `GET /dashboard/customers` with only the `page` parameter; no search or filter contract is assumed.
- Customer Detail uses authoritative `GET /dashboard/customers/:id`, while its independently loaded order history uses paginated `GET /dashboard/customers/:id/orders`.
- Block and unblock use empty-body `POST /dashboard/customers/:id/block` and `POST /dashboard/customers/:id/unblock` requests.
- Access mutations are non-optimistic and explicitly disable retry. Both existing services discard mutation response data; success invalidates Customer lists and the affected Customer detail only. Customer Orders remain mounted and cached. One authoritative Show refetch supplies the access state, without assuming the undocumented Unblock response has full detail. Confirmation uses a synchronous submission lock and is disabled if the visible profile is refreshing or has a background error.
- Display identity prefers non-empty `name`, then first and last name, email, phone, and finally a localized `Customer #ID` fallback.
- Index `lifetime_spend` remains a finite number. Customer Orders `total` retains its decimal string at the existing service boundary (numeric responses are converted to strings), then uses the existing Orders decimal formatter without floating-point conversion or recalculation. Order/payment badges reuse Orders presentation; unknown values remain readable.
- Customer Index does not provide a currency for `lifetime_spend`, so the Dashboard renders only its localized numeric value. Order totals use each order's provided currency code.
- Customers has no Create, Edit, or Delete flow.

## Customer 360 Details

The existing route and Index View action use the one canonical `useCustomer` / `customersKeys.detail(id)` Show query. There is no Edit flow or competing Show key. Strict invalid route IDs mount neither core nor Orders queries. Valid profiles start Show and `useCustomerOrders` independently: one Show GET and one `/dashboard/customers/:id/orders?page=1` GET. The Orders observer belongs to the Orders section and stays mounted across core readiness, avoiding a second GET when Show completes.

Core sections cover identity, account/preferences, access and metadata. The page uses the existing name fallback utility with localized Customer Details as its final fallback. Account `status` and access `is_blocked` remain distinct; the established action uses `is_blocked`, without changing precedence. No Index, Addresses or other enrichment is fetched. Lifetime spend is omitted. Orders count comes only from pagination `meta.total`.

Customer Orders uses shared infinite pagination and viewport loading plus an accessible Load more action. Later-page failures retain prior rows and suspend automatic loading until scoped retry. Links use numeric Order IDs and the existing Order Details route. Core and Orders loading/error boundaries are independent; Show 404 is authoritative only without cached core data. Background Show errors retain profile and Orders. Core cards and Orders table/mobile cards share loaded/skeleton composition.

The saved Unblock example remains stale/mislabeled. This implementation adds no runtime evidence about its success body and preserves conservative invalidation.
