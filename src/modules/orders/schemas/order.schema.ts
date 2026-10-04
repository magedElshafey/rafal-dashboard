import { z } from 'zod'

const text = z.string().trim().min(1)
const id = z.number().int().positive().safe()
const count = z.number().int().nonnegative().safe()
const decimal = z.string().regex(/^\d+(?:\.\d+)?$/)
const nullableText = z.string().nullable().catch(null)
const customer = z.object({ type: text, name: z.string(), email: z.string(), phone: z.string() })
const warehouse = z.object({ id, name: text }).nullable()
const identity = {
  id,
  order_number: text,
  display_number: text,
  status: text,
  customer,
  warehouse,
  placed_at: nullableText,
}

// Validate before constructing a record: Zod's record parser can discard __proto__.
export const attributesSchema = z.unknown().transform((value, ctx): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    ctx.addIssue({ code: 'custom', message: 'Invalid attributes' })
    return z.NEVER
  }
  const entries = Object.entries(value)
  if (
    entries.some(([key, entry]) => ['__proto__', 'prototype', 'constructor'].includes(key) || typeof entry !== 'string')
  ) {
    ctx.addIssue({ code: 'custom', message: 'Invalid attribute entry' })
    return z.NEVER
  }
  const result: Record<string, string> = {}
  for (const [key, entry] of entries) if (typeof entry === 'string') result[key] = entry
  return result
})

export const rawOrderStatusSchema = z.object({ value: text, label: text, customer_status: text })
export const rawOrderListItemSchema = z.object({
  ...identity,
  items_count: count,
  total: decimal,
  currency: text,
  payment_status: text,
  is_gift: z.union([z.boolean(), z.literal(0), z.literal(1)]),
})
const giftBoolean = z.union([z.boolean(), z.literal(0), z.literal(1)])
export const rawOrderGiftSchema = z.object({
  is_anonymous: giftBoolean,
  message: z.string().nullable(),
  wrap: giftBoolean,
  wrap_fee: decimal,
  buyer: customer,
  recipient: z.object({
    name: z.string(),
    phone: z.string(),
    city: z.object({ id, name: text }).nullable(),
    district: z.string(),
    street_details: z.string(),
  }),
})
export const rawOrderDetailSchema = z.object({
  ...identity,
  shipping_address: z
    .object({
      recipient_name: z.string(),
      recipient_phone: z.string(),
      city: z.object({ id, name: text }).nullable(),
      district: z.string(),
      street_details: z.string(),
    })
    .nullable(),
  items: z.array(
    z.object({
      id,
      product_name: text,
      variant_sku: text,
      variant_attributes: attributesSchema,
      quantity: id,
      unit_price: decimal,
      discount_amount: decimal,
      line_total: decimal,
    })
  ),
  money: z.object({
    subtotal: decimal,
    discount_total: decimal,
    shipping_fee: decimal,
    personalization_total: decimal,
    gift_wrap_fee: decimal,
    taxable_amount: decimal,
    vat: z.object({ rate: decimal, amount: decimal }),
    total: decimal,
    currency: text,
  }),
  coupon: z.unknown(),
  payment: z.object({ method: text, status: text, reference: nullableText, paid_at: nullableText }),
  status_history: z.array(
    z.object({
      from_status: text.nullable(),
      to_status: text,
      note: nullableText,
      actor_type: text,
      actor_id: id.nullable(),
      actor_name: nullableText,
      created_at: text,
    })
  ),
  allowed_transitions: z.array(text),
  cancelled_at: nullableText,
  created_at: nullableText,
  updated_at: nullableText,
  gift: rawOrderGiftSchema.nullable().optional(),
})
export const successEnvelopeSchema = z.object({
  success: z.literal(true),
  message: z.string().optional().catch(undefined),
  data: z.unknown(),
})
export const failureEnvelopeSchema = z.object({
  success: z.literal(false).optional(),
  message: z.string().optional(),
  errors: z.object({ status: z.array(text).optional(), allowed_transitions: z.array(text).optional() }).optional(),
})
export const paginationSchema = z.object({ current_page: id, last_page: id, per_page: id, total: count })
