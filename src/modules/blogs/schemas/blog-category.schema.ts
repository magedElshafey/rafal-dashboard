import { normalizeSlug } from '@/utils/slug'
import { z } from 'zod'
import * as yup from 'yup'
export const blogCategoryIdSchema = z.number().int().positive().safe()
export const blogCategoryReferenceSchema = z.object({
  id: blogCategoryIdSchema,
  slug: z.string(),
  name: z.object({ ar: z.string(), en: z.string() }),
})
export const rawBlogCategorySchema = blogCategoryReferenceSchema.extend({
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
})
export const blogCategoriesEnvelopeSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(rawBlogCategorySchema),
  meta: z.object({
    current_page: z.number().int().positive(),
    last_page: z.number().int().positive(),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
})
export const blogCategoryDeleteSchema = z.object({ success: z.literal(true), message: z.string() })

export const blogCategoryEnvelopeSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: rawBlogCategorySchema,
})
export function createBlogCategoryFormSchema(
  required: string,
  invalidSlug: string,
  mode: 'create' | 'edit' = 'create'
) {
  return yup
    .object({
      slug: yup.string().required(required),
      name: yup.object({
        ar: yup.string().trim().required(required),
        en: yup
          .string()
          .trim()
          .required(required)
          .test('slug-source', invalidSlug, (value) => mode === 'edit' || Boolean(normalizeSlug(value ?? ''))),
      }),
    })
    .transform((value) => ({
      ...value,
      slug: mode === 'create' ? normalizeSlug(value?.name?.en ?? '') : (value?.slug ?? ''),
    }))
}
