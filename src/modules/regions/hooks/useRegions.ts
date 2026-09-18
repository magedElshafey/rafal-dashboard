import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { regionsService } from '@/modules/regions/api/regions.service'
import { regionsKeys } from '@/modules/regions/queries/regions.keys'

export function useRegions() {
  return useInfinitePaginatedQuery({
    queryKey: regionsKeys.list(),
    queryFn: (page, signal) => regionsService.list(page, signal),
    retry: false,
  })
}
