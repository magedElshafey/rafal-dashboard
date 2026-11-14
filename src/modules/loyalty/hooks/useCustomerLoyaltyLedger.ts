import { useQuery } from '@tanstack/react-query'

import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'
import type { LoyaltyLedgerFilters } from '@/modules/loyalty/types/loyalty.types'
import { getLoyaltyLedgerDateState } from '@/modules/loyalty/utils/loyalty-ledger'

export function useCustomerLoyaltyLedger(customerId: number, filters: LoyaltyLedgerFilters, enabled: boolean) {
  return useQuery({
    queryKey: loyaltyKeys.customerLedger(customerId, filters),
    queryFn: ({ signal }) => loyaltyService.getCustomerLedger(customerId, filters, signal),
    enabled: enabled && getLoyaltyLedgerDateState(filters) === 'valid',
    retry: false,
    // The global client disables mount refetches. An adjustment can invalidate
    // this query after its observer unmounts, so refresh stale history on reopen.
    refetchOnMount: true,
  })
}
