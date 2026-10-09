import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { bannersService } from '@/modules/banners/api/banners.service'
import { bannersKeys } from '@/modules/banners/queries/banners.keys'
import type { BannersFilters } from '@/modules/banners/types/banner.types'
import { emptyBannersFilters } from '@/modules/banners/utils/banner-filters'

export function useBanners(filters: BannersFilters = emptyBannersFilters) {
  return useInfinitePaginatedQuery({
    queryKey: bannersKeys.list(filters),
    queryFn: (page, signal) => bannersService.list(page, signal, filters),
    retry: false,
  })
}
