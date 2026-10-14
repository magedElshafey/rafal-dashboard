import type { BlogPostsFilters } from '@/modules/blogs/types/blog-post.types'
import { serializeBlogPostsFilters } from '@/modules/blogs/utils/blog-post-filters'
export const blogPostsKeys = {
  lists: () => ['blog-posts', 'list'] as const,
  list: (filters: BlogPostsFilters) => [...blogPostsKeys.lists(), serializeBlogPostsFilters(filters)] as const,
}
