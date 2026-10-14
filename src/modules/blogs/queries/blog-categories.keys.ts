import type { BlogCategoriesFilters } from '@/modules/blogs/types/blog-category.types'
import { serializeBlogCategoriesFilters } from '@/modules/blogs/utils/blog-category-filters'
export const blogCategoriesKeys = {
  lists: () => ['blog-categories', 'list'] as const,
  list: (filters: BlogCategoriesFilters) =>
    [...blogCategoriesKeys.lists(), serializeBlogCategoriesFilters(filters)] as const,
}
