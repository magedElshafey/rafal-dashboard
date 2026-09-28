import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'

export function useStaticPages() {
  return useInfinitePaginatedQuery({
    queryKey: staticPagesKeys.list(),
    queryFn: (page, signal) => staticPagesService.list(page, signal),
    retry: false,
  })
}
