import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { customersService } from '@/modules/customers/api/customers.service'
import { customersKeys } from '@/modules/customers/queries/customers.keys'

export function useCustomers() {
  return useInfinitePaginatedQuery({
    queryKey: customersKeys.list(),
    queryFn: (page, signal) => customersService.list(page, signal),
    retry: false,
  })
}
