import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { regionsService } from '@/modules/regions/api/regions.service'
import { regionsKeys } from '@/modules/regions/queries/regions.keys'
import type { RegionsFilters } from '@/modules/regions/types/region.types'
import { emptyRegionsFilters } from '@/modules/regions/utils/region-filters'

export function useRegions(filters: RegionsFilters = emptyRegionsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: regionsKeys.list(filters),
    queryFn: (page, signal) => regionsService.list(page, signal, filters),
    retry: false,
  })
}
