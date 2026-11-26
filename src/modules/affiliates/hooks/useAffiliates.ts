import { isAffiliateFeatureEnabled } from '../config/affiliate-feature'
import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'
import type { AffiliateFilters } from '@/modules/affiliates/types/affiliate.types'
import { emptyAffiliateFilters } from '@/modules/affiliates/utils/affiliate-filters'

export function useAffiliates(filters: AffiliateFilters = emptyAffiliateFilters) {
  return useInfinitePaginatedQuery({
    queryKey: affiliatesKeys.list(filters),
    queryFn: (page, signal) => affiliatesService.list(page, signal, filters),
    enabled: isAffiliateFeatureEnabled,
    retry: false,
  })
}
