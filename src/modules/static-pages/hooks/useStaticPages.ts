import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'
import type { PagesFilters } from '@/modules/static-pages/types/static-page.types'
import { emptyPagesFilters } from '@/modules/static-pages/utils/static-page-filters'

export function useStaticPages(filters: PagesFilters = emptyPagesFilters) {
  return useInfinitePaginatedQuery({
    queryKey: staticPagesKeys.list(filters),
    queryFn: (page, signal) => staticPagesService.list(page, signal, filters),
    retry: false,
  })
}
