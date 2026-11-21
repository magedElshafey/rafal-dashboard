import { useQuery } from '@tanstack/react-query'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'

export function useAffiliateActivity(id: number, enabled = true) {
  return useQuery({
    queryKey: affiliatesKeys.activity(id),
    queryFn: ({ signal }) => affiliatesService.activity(id, signal),
    enabled,
    retry: false,
  })
}
