import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { citiesService } from '@/modules/cities/api/cities.service'
import { citiesKeys } from '@/modules/cities/queries/cities.keys'

export function useCities() {
  return useInfinitePaginatedQuery({
    queryKey: citiesKeys.list(),
    queryFn: (page, signal) => citiesService.list(page, signal),
    retry: false,
  })
}
