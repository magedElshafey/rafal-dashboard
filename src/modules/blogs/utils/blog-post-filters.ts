import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import type { BlogPostsFilters } from '@/modules/blogs/types/blog-post.types'
export const blogPostSortValues = ['created_at', 'published_at', 'title', 'is_featured'] as const
export const blogPostFilterNames = [
  'blog_category_id',
  'is_published',
  'is_featured',
  'published_from',
  'published_to',
  'sort_by',
  'sort_dir',
]
const triState = (value?: string) => (value === '1' ? true : value === '0' ? false : null)
export function readBlogPostsFilters(query: Record<string, string> | null): BlogPostsFilters {
  const category = query?.blog_category_id
  return {
    search: query?.search?.trim() ?? '',
    categoryId:
      category && /^[1-9]\d*$/.test(category) && Number.isSafeInteger(Number(category)) ? Number(category) : null,
    isPublished: triState(query?.is_published),
    isFeatured: triState(query?.is_featured),
    publishedFrom: query?.published_from ?? '',
    publishedTo: query?.published_to ?? '',
    sortBy: blogPostSortValues.find((value) => value === query?.sort_by) ?? null,
    sortDir: query?.sort_dir === 'asc' || query?.sort_dir === 'desc' ? query.sort_dir : null,
  }
}
export function validBlogPublishedRange(filters: BlogPostsFilters) {
  const validDate = (value: string) => {
    if (!value) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  }
  return (
    validDate(filters.publishedFrom) &&
    validDate(filters.publishedTo) &&
    (!filters.publishedFrom || !filters.publishedTo || filters.publishedFrom <= filters.publishedTo)
  )
}
export function serializeBlogPostsFilters(filters: BlogPostsFilters) {
  return {
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.categoryId !== null ? { blog_category_id: filters.categoryId } : {}),
    ...(filters.isPublished !== null ? { is_published: toApiBoolean(filters.isPublished) } : {}),
    ...(filters.isFeatured !== null ? { is_featured: toApiBoolean(filters.isFeatured) } : {}),
    ...(filters.publishedFrom ? { published_from: filters.publishedFrom } : {}),
    ...(filters.publishedTo ? { published_to: filters.publishedTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
