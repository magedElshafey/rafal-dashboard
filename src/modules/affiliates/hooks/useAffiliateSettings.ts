import { useQuery } from '@tanstack/react-query'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'

export function useAffiliateSettings() {
  return useQuery({
    queryKey: affiliatesKeys.settings(),
    queryFn: ({ signal }) => affiliatesService.getSettings(signal),
    retry: false,
  })
}
