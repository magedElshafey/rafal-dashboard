import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { categoriesService } from '@/modules/categories/api/categories.service'
import { categoriesKeys } from '@/modules/categories/queries/categories.keys'

export function useCategories() {
  return useInfinitePaginatedQuery({
    queryKey: categoriesKeys.list(),
    queryFn: (page, signal) => categoriesService.list(page, signal),
    retry: false,
  })
}
