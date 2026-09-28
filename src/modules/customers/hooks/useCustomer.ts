import { useQuery } from '@tanstack/react-query'

import { customersService } from '@/modules/customers/api/customers.service'
import { customersKeys } from '@/modules/customers/queries/customers.keys'

export function useCustomer(id: number | null) {
  return useQuery({
    queryKey: customersKeys.detail(id ?? 0),
    queryFn: ({ signal }) => customersService.show(id as number, signal),
    enabled: id !== null,
    retry: false,
  })
}
