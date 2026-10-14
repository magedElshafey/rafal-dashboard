import { normalizeSlug } from '@/utils/slug'
import { $http } from '@/utils/http'
import { blogCategoryEnvelopeSchema } from '@/modules/blogs/schemas/blog-category.schema'
import type { BlogCategoryFormValues } from '@/modules/blogs/types/blog-category.types'
import {
  blogCategoriesEnvelopeSchema,
  blogCategoryDeleteSchema,
  blogCategoryIdSchema,
} from '@/modules/blogs/schemas/blog-category.schema'
import type { BlogCategory, BlogCategoriesFilters, RawBlogCategory } from '@/modules/blogs/types/blog-category.types'
import { serializeBlogCategoriesFilters } from '@/modules/blogs/utils/blog-category-filters'
export function normalizeBlogCategory(raw: RawBlogCategory): BlogCategory {
  return { id: raw.id, slug: raw.slug, name: raw.name, createdAt: raw.created_at, updatedAt: raw.updated_at }
}
export function serializeBlogCategory(values: BlogCategoryFormValues, mode: 'create' | 'edit' = 'create') {
  const body = new FormData()
  for (const locale of ['ar', 'en'] as const) {
    const value = values.name[locale].trim()
    if (!value) throw new Error('Missing category name')
    body.set(`name[${locale}]`, value)
  }
  if (mode === 'create') {
    const slug = normalizeSlug(values.name.en)
    if (!slug) throw new Error('Invalid category slug source')
    body.set('slug', slug)
  } else {
    if (!values.slug.trim()) throw new Error('Missing persisted category slug')
    body.set('slug', values.slug)
  }
  return body
}
export const blogCategoriesService = {
  async create(values: BlogCategoryFormValues) {
    const response = await $http.post({
      url: '/dashboard/blog-categories',
      data: serializeBlogCategory(values),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    return normalizeBlogCategory(blogCategoryEnvelopeSchema.parse(response.data).data)
  },
  async update(id: number, values: BlogCategoryFormValues) {
    blogCategoryIdSchema.parse(id)
    // Multipart PUT follows the repository convention; backend encoding is not independently verified.
    const response = await $http.put({
      url: `/dashboard/blog-categories/${id}`,
      data: serializeBlogCategory(values, 'edit'),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    const category = normalizeBlogCategory(blogCategoryEnvelopeSchema.parse(response.data).data)
    if (category.id !== id) throw new Error('Blog category identity mismatch')
    return category
  },
  async list(filters: BlogCategoriesFilters, page: number, signal?: AbortSignal): Promise<PaginatedData<BlogCategory>> {
    blogCategoryIdSchema.parse(page)
    const response = await $http.get({
      url: '/dashboard/blog-categories',
      query: { ...serializeBlogCategoriesFilters(filters), page },
      signal,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    const { data, meta } = blogCategoriesEnvelopeSchema.parse(response.data)
    const items = data.map(normalizeBlogCategory)
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
  async delete(id: number) {
    blogCategoryIdSchema.parse(id)
    const response = await $http.delete({
      url: `/dashboard/blog-categories/${id}`,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    return blogCategoryDeleteSchema.parse(response.data)
  },
}
