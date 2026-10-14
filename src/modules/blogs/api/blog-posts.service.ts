import { normalizeSlug } from '@/utils/slug'
import { $http } from '@/utils/http'
import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import { blogCategoryIdSchema } from '@/modules/blogs/schemas/blog-category.schema'
import { blogPostsEnvelopeSchema, isBlogCover } from '@/modules/blogs/schemas/blog-post.schema'
import type { BlogPost, BlogPostFormValues, BlogPostsFilters, RawBlogPost } from '@/modules/blogs/types/blog-post.types'
import { serializeBlogPostsFilters, validBlogPublishedRange } from '@/modules/blogs/utils/blog-post-filters'
export function normalizeBlogPost(raw: RawBlogPost): BlogPost {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt,
    body: raw.body,
    authorName: raw.author_name,
    isFeatured: raw.is_featured,
    publishedAt: raw.published_at,
    readingTimeMinutes: raw.reading_time_minutes,
    coverUrl: raw.cover_url,
    category: raw.category,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}
export function serializeBlogPostCreate(values: BlogPostFormValues) {
  if (values.cover.files.length !== 1 || !isBlogCover(values.cover.files[0])) throw new Error('Invalid blog cover')
  const body = new FormData()
  // English keys follow the product requirement; live acceptance/persistence still needs verification.
  const fields = {
    slug: normalizeSlug(values.title.en),
    'title[ar]': values.title.ar,
    'title[en]': values.title.en,
    'excerpt[ar]': values.excerpt.ar,
    'excerpt[en]': values.excerpt.en,
    'body[ar]': values.body.ar,
    'body[en]': values.body.en,
    author_name: values.authorName,
  }
  Object.entries(fields).forEach(([key, value]) => {
    if (!value.trim()) throw new Error('Missing blog content')
    body.set(key, value.trim())
  })
  if (values.categoryId !== null) {
    const categoryId = blogCategoryIdSchema.parse(values.categoryId)
    body.set('category_id', String(categoryId))
  }
  body.set('is_featured', String(toApiBoolean(values.isFeatured)))
  body.set('cover', values.cover.files[0])
  return body
}
export const blogPostsService = {
  async list(filters: BlogPostsFilters, page: number, signal?: AbortSignal): Promise<PaginatedData<BlogPost>> {
    blogCategoryIdSchema.parse(page)
    if (!validBlogPublishedRange(filters)) throw new Error('Invalid blog publication range')
    const response = await $http.get({
      url: '/dashboard/blog-posts',
      query: { ...serializeBlogPostsFilters(filters), page },
      signal,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    const { data, meta } = blogPostsEnvelopeSchema.parse(response.data)
    const items = data.map(normalizeBlogPost)
    return {
      items,
      paginate: {
        current_page: meta.current_page,
        total_pages: meta.last_page,
        per_page: meta.per_page,
        total: meta.total,
        count: items.length,
        next_page_url: meta.current_page < meta.last_page ? String(meta.current_page + 1) : null,
        prev_page_url: meta.current_page > 1 ? String(meta.current_page - 1) : null,
      },
      extra: null,
    }
  },
  async create(values: BlogPostFormValues) {
    // No authoritative create response was supplied. Use HTTP success, never fabricate a cached entity.
    await $http.post({
      url: '/dashboard/blog-posts',
      data: serializeBlogPostCreate(values),
      isFormData: true,
      suppressErrorNotification: true,
      suppressSuccessNotification: true,
      suppressForbiddenRedirect: true,
    })
  },
}
