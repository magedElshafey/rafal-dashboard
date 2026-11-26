import { isAffiliateFeatureEnabled } from '../config/affiliate-feature'
import { useQuery } from '@tanstack/react-query'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'

export function useAffiliate(id: number | null, range: { from?: string; to?: string } = {}) {
  return useQuery({
    queryKey: affiliatesKeys.period(id ?? 0, range),
    queryFn: ({ signal }) => affiliatesService.show(id as number, signal, range),
    enabled: isAffiliateFeatureEnabled && id !== null,
    retry: false,
  })
}
