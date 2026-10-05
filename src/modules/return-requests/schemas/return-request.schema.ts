import { z } from 'zod'

const id = z.number().int().positive().safe()
const text = z.string().trim().min(1)
const nullableText = z.string().nullable()

const decidedAdminSchema = z.object({
  id,
  name: z.string(),
  email: text,
})

export const rawReturnRequestSchema = z.object({
  id,
  order: z.object({ id, order_number: text, status: text }),
  user: z.object({ id, name: z.string(), email: text }),
  status: text,
  reason: text,
  reason_label: text,
  comment: nullableText,
  decision_note: nullableText.optional().transform((value) => value ?? null),
  decided_by_admin: decidedAdminSchema
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  decided_at: nullableText.optional().transform((value) => value ?? null),
  created_at: text,
  updated_at: text,
})

export const returnRequestsMetaSchema = z.object({ current_page: id, per_page: id })

export const returnRequestSuccessEnvelopeSchema = z.object({
  success: z.literal(true),
  message: z.string().optional().catch(undefined),
  data: z.unknown().optional(),
})

export const returnRequestIndexEnvelopeSchema = returnRequestSuccessEnvelopeSchema.extend({
  data: z.array(z.unknown()),
  meta: returnRequestsMetaSchema,
})

export const returnRequestFailureEnvelopeSchema = z.object({
  success: z.literal(false).optional(),
  message: z.string().optional(),
  errors: z.object({ decision_note: z.array(z.string()).optional() }).optional(),
})
