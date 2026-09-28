export const customersKeys = {
  all: ['customers'] as const,
  lists: () => [...customersKeys.all, 'list'] as const,
  list: () => [...customersKeys.lists()] as const,
  details: () => [...customersKeys.all, 'detail'] as const,
  detail: (id: number) => [...customersKeys.details(), id] as const,
  orders: (id: number) => [...customersKeys.all, 'orders', id] as const,
  ordersLists: (id: number) => [...customersKeys.orders(id), 'list'] as const,
  ordersList: (id: number) => [...customersKeys.ordersLists(id)] as const,
}
