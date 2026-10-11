import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { storeRatingsService } from '../api/store-ratings.service'
import { storeRatingsKeys } from '../queries/store-ratings.keys'
import type { StoreRatingsFilters } from '../types/store-rating.types'
import { validStoreRatingsFilters } from '../utils/store-rating-filters'

export function useStoreRatings(filters: StoreRatingsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: storeRatingsKeys.list(filters),
    queryFn: (page, signal) => storeRatingsService.list(page, signal, filters),
    enabled: validStoreRatingsFilters(filters),
    retry: false,
  })
}
