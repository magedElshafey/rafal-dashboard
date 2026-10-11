import type { StoreRatingsFilters } from '../types/store-rating.types'
import { emptyStoreRatingsFilters } from '../utils/store-rating-filters'

export const storeRatingsKeys = {
  all: ['store-ratings'] as const,
  lists: () => [...storeRatingsKeys.all, 'list'] as const,
  list: (filters: StoreRatingsFilters = emptyStoreRatingsFilters) => [...storeRatingsKeys.lists(), filters] as const,
}
