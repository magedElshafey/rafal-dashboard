import { useQuery } from '@tanstack/react-query'

import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'

export function useLoyaltySettings() {
  return useQuery({
    queryKey: loyaltyKeys.settings(),
    queryFn: ({ signal }) => loyaltyService.getSettings(signal),
    retry: false,
  })
}
