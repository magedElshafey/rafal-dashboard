import { z } from 'zod'

export const contactMessageIdSchema = z.number().int().positive().safe()
export const contactMessageWritableStatusSchema = z.enum(['new', 'read', 'resolved'])
export const rawContactMessageUserSchema = z.object({
  id: contactMessageIdSchema,
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
})
export const rawContactMessageSchema = z.object({
  id: contactMessageIdSchema,
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  subject: z.string(),
  message: z.string(),
  status: z.string(),
  status_label: z.string(),
  user: rawContactMessageUserSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export const contactMessageDeleteEnvelopeSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
})
export const contactMessageShowEnvelopeSchema = contactMessageDeleteEnvelopeSchema.extend({
  data: rawContactMessageSchema,
})
export const contactMessageStatusEnvelopeSchema = contactMessageShowEnvelopeSchema
export const contactMessagesIndexEnvelopeSchema = contactMessageDeleteEnvelopeSchema.extend({
  data: z.array(rawContactMessageSchema),
  meta: z.object({
    current_page: contactMessageIdSchema,
    last_page: contactMessageIdSchema,
    per_page: contactMessageIdSchema,
    total: z.number().int().nonnegative().safe(),
    new_count: z.number().int().nonnegative().safe(),
  }),
})
