import { normalizeSlug } from '@/utils/slug'
import { z } from 'zod'
import * as yup from 'yup'
import {
  blogCategoriesEnvelopeSchema,
  blogCategoryIdSchema,
  blogCategoryReferenceSchema,
} from '@/modules/blogs/schemas/blog-category.schema'
import type { ImageUploadValue } from '@/components/form/image-upload/image-upload.types'
const localizedContent = z.object({ ar: z.string(), en: z.string().optional() })
export const rawBlogPostSchema = z.object({
  id: blogCategoryIdSchema,
  slug: z.string(),
  title: localizedContent,
  excerpt: localizedContent,
  body: localizedContent,
  author_name: z.string(),
  is_featured: z.boolean(),
  published_at: z.string().datetime({ offset: true }).nullable(),
  reading_time_minutes: z.number().int().nonnegative(),
  cover_url: z.string(),
  category: blogCategoryReferenceSchema.nullable(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export const blogPostsEnvelopeSchema = blogCategoriesEnvelopeSchema.extend({ data: z.array(rawBlogPostSchema) })
export function isBlogCover(file: unknown): file is File {
  return file instanceof File && file.size > 0 && file.type.startsWith('image/')
}
export function createBlogPostFormSchema(
  required: string,
  invalidImage: string,
  invalidSlug: string,
  invalidCategory: string
) {
  const text = () => yup.string().trim().required(required)
  return yup
    .object({
      slug: text(),
      title: yup.object({
        ar: text(),
        en: text().test('slug-source', invalidSlug, (value) => Boolean(normalizeSlug(value ?? ''))),
      }),
      excerpt: yup.object({ ar: text(), en: text() }),
      body: yup.object({ ar: text(), en: text() }),
      categoryId: yup
        .mixed<number>()
        .nullable()
        .defined()
        .test(
          'category-id',
          invalidCategory,
          (value) => value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value > 0)
        ),
      authorName: text(),
      isFeatured: yup.boolean().required(required),
      cover: yup
        .mixed<ImageUploadValue>()
        .required(required)
        .test('image', invalidImage, (value) => value?.files?.length === 1 && isBlogCover(value.files[0])),
    })
    .transform((value) => ({ ...value, slug: normalizeSlug(value?.title?.en ?? '') }))
}
