import type { BannersFilters } from '../types/banner.types'
import { emptyBannersFilters } from '../utils/banner-filters'

export const bannersKeys = {
  all: ['banners'] as const,
  lists: () => [...bannersKeys.all, 'list'] as const,
  list: (filters: BannersFilters = emptyBannersFilters) => [...bannersKeys.lists(), filters] as const,
  details: () => [...bannersKeys.all, 'detail'] as const,
  detail: (id: number) => [...bannersKeys.details(), id] as const,
}
