import type { z } from 'zod'
import type { rawBlogCategorySchema } from '@/modules/blogs/schemas/blog-category.schema'
export type RawBlogCategory = z.infer<typeof rawBlogCategorySchema>
export type BlogCategory = {
  id: number
  slug: string
  name: { ar: string; en: string }
  createdAt: string
  updatedAt: string
}
export type BlogCategoriesFilters = {
  search: string
  sortBy: 'id' | 'name' | 'created_at' | null
  sortDir: 'asc' | 'desc' | null
}

export type BlogCategoryFormValues = { slug: string; name: { ar: string; en: string } }
