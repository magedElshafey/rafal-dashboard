import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { customersService } from '@/modules/customers/api/customers.service'
import { customersKeys } from '@/modules/customers/queries/customers.keys'

export function useCustomerOrders(id: number | null) {
  return useInfinitePaginatedQuery({
    queryKey: customersKeys.ordersList(id ?? 0),
    queryFn: (page, signal) => customersService.orders(id as number, page, signal),
    enabled: id !== null,
    retry: false,
  })
}
