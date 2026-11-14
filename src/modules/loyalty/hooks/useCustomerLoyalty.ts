import { useQuery } from '@tanstack/react-query'

import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'

export function useCustomerLoyalty(customerId: number, enabled: boolean) {
  return useQuery({
    queryKey: loyaltyKeys.customerSummary(customerId),
    queryFn: ({ signal }) => loyaltyService.getCustomerSummary(customerId, signal),
    enabled,
    retry: false,
  })
}
