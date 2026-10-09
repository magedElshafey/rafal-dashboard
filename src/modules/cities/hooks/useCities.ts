import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { citiesService } from '@/modules/cities/api/cities.service'
import { citiesKeys } from '@/modules/cities/queries/cities.keys'
import type { CitiesFilters } from '@/modules/cities/types/city.types'
import { emptyCitiesFilters } from '@/modules/cities/utils/city-filters'

export function useCities(filters: CitiesFilters = emptyCitiesFilters) {
  return useInfinitePaginatedQuery({
    queryKey: citiesKeys.list(filters),
    queryFn: (page, signal) => citiesService.list(page, signal, filters),
    retry: false,
  })
}
