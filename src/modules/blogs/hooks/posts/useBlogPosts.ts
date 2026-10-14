import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { blogPostsService } from '@/modules/blogs/api/blog-posts.service'
import { blogPostsKeys } from '@/modules/blogs/queries/blog-posts.keys'
import type { BlogPostsFilters } from '@/modules/blogs/types/blog-post.types'
import { validBlogPublishedRange } from '@/modules/blogs/utils/blog-post-filters'
export function useBlogPosts(filters: BlogPostsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: blogPostsKeys.list(filters),
    queryFn: (page, signal) => blogPostsService.list(filters, page, signal),
    enabled: validBlogPublishedRange(filters),
    retry: false,
  })
}
