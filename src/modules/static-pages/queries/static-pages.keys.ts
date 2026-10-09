import type { PagesFilters } from '@/modules/static-pages/types/static-page.types'
import { emptyPagesFilters } from '@/modules/static-pages/utils/static-page-filters'

export const staticPagesKeys = {
  all: ['static-pages'] as const,
  lists: () => [...staticPagesKeys.all, 'list'] as const,
  list: (filters: PagesFilters = emptyPagesFilters) => [...staticPagesKeys.lists(), filters] as const,
  details: () => [...staticPagesKeys.all, 'detail'] as const,
  detail: (id: number) => [...staticPagesKeys.details(), id] as const,
}
