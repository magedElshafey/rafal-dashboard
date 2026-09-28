import { useQuery } from '@tanstack/react-query'

import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'

export function useStaticPage(id: number | null) {
  return useQuery({
    queryKey: staticPagesKeys.detail(id ?? 0),
    queryFn: ({ signal }) => staticPagesService.show(id as number, signal),
    enabled: id !== null,
    retry: false,
  })
}
