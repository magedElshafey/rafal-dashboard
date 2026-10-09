import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { customersService } from '@/modules/customers/api/customers.service'
import { customersKeys } from '@/modules/customers/queries/customers.keys'
import type { CustomersFilters } from '@/modules/customers/types/customer.types'
import { emptyCustomersFilters, validCustomersDateRange } from '@/modules/customers/utils/customer-filters'

export function useCustomers(filters: CustomersFilters = emptyCustomersFilters) {
  return useInfinitePaginatedQuery({
    queryKey: customersKeys.list(filters),
    queryFn: (page, signal) => customersService.list(page, signal, filters),
    enabled: validCustomersDateRange(filters),
    retry: false,
  })
}
