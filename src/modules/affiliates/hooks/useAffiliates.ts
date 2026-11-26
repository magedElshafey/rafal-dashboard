import { useAffiliateAccess } from '../config/affiliate-access'
import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'
import type { AffiliateFilters } from '@/modules/affiliates/types/affiliate.types'
import { emptyAffiliateFilters } from '@/modules/affiliates/utils/affiliate-filters'

export function useAffiliates(filters: AffiliateFilters = emptyAffiliateFilters) {
  const allowed = useAffiliateAccess('view')
  return useInfinitePaginatedQuery({
    queryKey: affiliatesKeys.list(filters),
    queryFn: (page, signal) => affiliatesService.list(page, signal, filters),
    enabled: allowed,
    retry: false,
  })
}
