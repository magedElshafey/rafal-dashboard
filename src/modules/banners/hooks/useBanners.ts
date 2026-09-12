import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { bannersService } from '@/modules/banners/api/banners.service'
import { bannersKeys } from '@/modules/banners/queries/banners.keys'

export function useBanners() {
  return useInfinitePaginatedQuery({
    queryKey: bannersKeys.list(),
    queryFn: (page, signal) => bannersService.list(page, signal),
    retry: false,
  })
}
