import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { categoriesService } from '@/modules/categories/api/categories.service'
import { categoriesKeys } from '@/modules/categories/queries/categories.keys'
import type { CategoriesFilters } from '@/modules/categories/types/category.types'
import { emptyCategoriesFilters, validCategoriesCreatedRange } from '@/modules/categories/utils/category-filters'

export function useCategories(filters: CategoriesFilters = emptyCategoriesFilters) {
  return useInfinitePaginatedQuery({
    queryKey: categoriesKeys.list(filters),
    queryFn: (page, signal) => categoriesService.list(filters, page, signal),
    enabled: validCategoriesCreatedRange(filters),
    retry: false,
  })
}
