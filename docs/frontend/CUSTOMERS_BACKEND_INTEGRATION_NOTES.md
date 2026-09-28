# Customers backend integration notes

- Customer Index uses paginated `GET /dashboard/customers` with only the `page` parameter; no search or filter contract is assumed.
- Customer Detail uses authoritative `GET /dashboard/customers/:id`, while its independently loaded order history uses paginated `GET /dashboard/customers/:id/orders`.
- Block and unblock use empty-body `POST /dashboard/customers/:id/block` and `POST /dashboard/customers/:id/unblock` requests.
- Access mutations are non-optimistic. Success invalidates Customer lists and the affected Customer detail only; Customer Orders remain cached and server refetch supplies the authoritative access state.
- Display identity prefers non-empty `name`, then first and last name, email, phone, and finally a localized `Customer #ID` fallback.
- `lifetime_spend` and order `total` strings are normalized to finite numbers at the service boundary. Unknown customer, order, and payment status strings remain readable instead of being rejected.
- Customer Index does not provide a currency for `lifetime_spend`, so the Dashboard renders only its localized numeric value. Order totals use each order's provided currency code.
- Customers has no Create, Edit, or Delete flow.
