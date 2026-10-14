import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { blogCategoriesService } from '@/modules/blogs/api/blog-categories.service'
import { blogCategoriesKeys } from '@/modules/blogs/queries/blog-categories.keys'
import type { BlogCategoriesFilters } from '@/modules/blogs/types/blog-category.types'
export function useBlogCategories(filters: BlogCategoriesFilters, enabled = true) {
  return useInfinitePaginatedQuery({
    queryKey: blogCategoriesKeys.list(filters),
    queryFn: (page, signal) => blogCategoriesService.list(filters, page, signal),
    enabled,
    retry: false,
  })
}
