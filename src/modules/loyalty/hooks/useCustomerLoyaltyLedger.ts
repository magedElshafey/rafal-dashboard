import { useQuery } from '@tanstack/react-query'

import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'
import type { LoyaltyLedgerFilters } from '@/modules/loyalty/types/loyalty.types'
import { getLoyaltyLedgerDateState } from '@/modules/loyalty/utils/loyalty-ledger'

const LEDGER_PAGE_SIZE = 50

export function useCustomerLoyaltyLedger(
  customerId: number,
  filters: LoyaltyLedgerFilters,
  page: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: loyaltyKeys.customerLedger(customerId, filters, page, LEDGER_PAGE_SIZE),
    queryFn: ({ signal }) => loyaltyService.getCustomerLedger(customerId, filters, page, LEDGER_PAGE_SIZE, signal),
    enabled: enabled && getLoyaltyLedgerDateState(filters) === 'valid',
    retry: false,
    // The global client disables mount refetches. An adjustment can invalidate
    // this query after its observer unmounts, so refresh stale history on reopen.
    refetchOnMount: true,
  })
}
