import type { z } from 'zod'
import type { rawBlogPostSchema } from '@/modules/blogs/schemas/blog-post.schema'
import type { ImageUploadValue } from '@/components/form/image-upload/image-upload.types'
export type RawBlogPost = z.infer<typeof rawBlogPostSchema>
export type BlogPost = {
  id: number
  slug: string
  title: { ar: string; en?: string }
  excerpt: { ar: string; en?: string }
  body: { ar: string; en?: string }
  authorName: string
  isFeatured: boolean
  publishedAt: string | null
  readingTimeMinutes: number
  coverUrl: string
  category: { id: number; slug: string; name: { ar: string; en: string } } | null
  createdAt: string
  updatedAt: string
}
export type BlogPostsFilters = {
  search: string
  categoryId: number | null
  isPublished: boolean | null
  isFeatured: boolean | null
  publishedFrom: string
  publishedTo: string
  sortBy: 'created_at' | 'published_at' | 'title' | 'is_featured' | null
  sortDir: 'asc' | 'desc' | null
}
export type BlogPostFormValues = {
  slug: string
  title: { ar: string; en: string }
  excerpt: { ar: string; en: string }
  body: { ar: string; en: string }
  categoryId: number | null
  authorName: string
  isFeatured: boolean
  cover: ImageUploadValue
}
