import type { BlogCategoriesFilters } from '@/modules/blogs/types/blog-category.types'
export const blogCategorySortValues = ['id', 'name', 'created_at'] as const
export const blogCategoryFilterNames = ['sort_by', 'sort_dir']
export function readBlogCategoriesFilters(query: Record<string, string> | null): BlogCategoriesFilters {
  return {
    search: query?.search?.trim() ?? '',
    sortBy: blogCategorySortValues.find((value) => value === query?.sort_by) ?? null,
    sortDir: query?.sort_dir === 'asc' || query?.sort_dir === 'desc' ? query.sort_dir : null,
  }
}
export function serializeBlogCategoriesFilters(filters: BlogCategoriesFilters) {
  return {
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
