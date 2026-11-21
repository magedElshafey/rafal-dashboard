import { z } from 'zod'

const statusSchema = z.enum(['active', 'suspended'])

export const affiliateSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    mobile: z.string().regex(/^\+9665\d{8}$/),
    email: z.string().email(),
    platform: z.string().min(1),
    username: z.string().min(1),
    code: z.string().regex(/^[A-Z0-9]{4,20}$/),
    status: statusSchema,
    created_at: z.string().datetime({ offset: true }),
    updated_at: z.string().datetime({ offset: true }),
  })
  .strict()

export const affiliatesIndexSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(affiliateSchema),
  meta: z.object({
    current_page: z.number().int().positive(),
    last_page: z.number().int().positive(),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
})

export const affiliateResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: affiliateSchema,
})

export const affiliateSuggestionSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.object({ code: z.string().regex(/^[A-Z0-9]{4,20}$/), reserved: z.literal(false) }),
})
