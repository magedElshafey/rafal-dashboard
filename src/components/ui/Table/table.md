# Table component system

The components in this directory are presentation helpers. The authoritative CRUD/list contract is [`docs/frontend/CRUD_MODULE_CONVENTIONS.md`](../../../../docs/frontend/CRUD_MODULE_CONVENTIONS.md).

## Ownership

`TableProvider` receives caller-owned `data`, optional paginated `serverData`, `isLoading`, and `refetch`. It does not fetch data or own URL/query state. Feature query hooks call feature services and pass the resulting state into the responsive presentation.

Normal CRUD index pages use:

- `ResponsiveDataLayout` for the shared state/header container;
- `ResponsiveDataDesktop` and the table primitives for large screens;
- `ResponsiveDataMobileCards` for small screens;
- one feature query and one derived item collection for both presentations; and
- `DashboardCardActions` for entity actions.

Numbered `TablePagination` is retained for explicitly approved legacy/product requirements. New normal CRUD lists MUST use the shared infinite-pagination hooks.

## Controlled provider example

```tsx
<TableProvider<Entity>
  name="entities"
  data={entities}
  serverData={latestPage}
  isLoading={query.isLoading}
  refetch={query.refetch}
>
  <Table>
    <TableHeader headers={headers} />
    <TableBody columnCount={headers.length} render={({ item }) => <EntityTableRow key={item.id} entity={item} />} />
  </Table>
</TableProvider>
```

Visible headers, empty copy, and action labels must be translated by the feature. Rows must use stable API entity IDs rather than array indexes.
