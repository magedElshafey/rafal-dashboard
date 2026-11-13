import { useQuery } from '@tanstack/react-query'

import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'

const HISTORY_PAGE_SIZE = 20

export function useLoyaltyVersions() {
  return useQuery({
    queryKey: loyaltyKeys.history(HISTORY_PAGE_SIZE),
    queryFn: ({ signal }) => loyaltyService.getVersions(HISTORY_PAGE_SIZE, signal),
    retry: false,
    // Global refetchOnMount is disabled. Refresh only a stale/invalidated cached
    // history when its URL-driven tab becomes active again.
    refetchOnMount: true,
  })
}
