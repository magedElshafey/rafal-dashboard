import type { OrdersFilters } from '../types/order.types'
export const ordersKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersKeys.all, 'list'] as const,
  list: (filters: OrdersFilters) => [...ordersKeys.lists(), filters] as const,
  details: () => [...ordersKeys.all, 'detail'] as const,
  detail: (id: number) => [...ordersKeys.details(), id] as const,
  statuses: () => [...ordersKeys.all, 'statuses'] as const,
}
