import { z } from 'zod'

const text = z.string().trim().min(1)
const id = z.number().int().positive().safe()
const count = z.number().int().nonnegative().safe()
const decimal = z.string().regex(/^\d+(?:\.\d+)?$/)
const nullableText = z.string().nullable().catch(null)
const customer = z.object({ type: text, name: z.string(), email: z.string(), phone: z.string() })
const orderCustomer = customer.extend({ email: z.string().nullable() })
// Detail-only display fields may be absent; keep list and Gift contracts unchanged.
const displayText = z
  .string()
  .nullish()
  .transform((value) => value ?? '')
  .catch(() => {
    console.warn('Order details: invalid optional display text omitted')
    return ''
  })
const detailCustomer = orderCustomer.extend({
  name: displayText,
  email: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  phone: displayText,
})
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
  if (Array.isArray(value)) {
    if (value.length === 0) return {}
    ctx.addIssue({ code: 'custom', message: 'Invalid attributes' })
    return z.NEVER
  }
  if (!value || typeof value !== 'object') {
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

const rawOrderItemPersonalizationSchema = z.object({
  text: z.string(),
  language: text,
  fee: decimal,
})

const rawOrderLoyaltySchema = z.object({
  points_earned: count,
  earned_status: nullableText.transform((value) => value?.trim() || null),
  available_on: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  return_window_days: count,
  points_redeemed: count,
  amount_applied: decimal,
  amount_due: decimal,
  value_per_point: z
    .union([z.number().finite().nonnegative(), decimal])
    .nullish()
    .transform((value) => value ?? null),
  points_returned: count,
  amount_per_point: decimal,
  rule_version_id: id,
})

export const rawOrderStatusSchema = z.object({ value: text, label: text, customer_status: text })
export const rawOrderListItemSchema = z.object({
  ...identity,
  customer: orderCustomer,
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
  display_number: displayText,
  customer: detailCustomer,
  shipping_address: z
    .object({
      recipient_name: displayText,
      recipient_phone: displayText,
      city: z
        .object({ id, name: displayText })
        .nullish()
        .transform((value) => value ?? null),
      district: displayText,
      street_details: displayText,
    })
    .nullish()
    .transform((value) => value ?? null),
  items: z.array(
    z.object({
      id,
      product_name: text,
      variant_sku: text,
      variant_attributes: attributesSchema.nullish().transform((value) => value ?? {}),
      quantity: id,
      unit_price: decimal,
      discount_amount: decimal,
      line_total: decimal,
      personalization: rawOrderItemPersonalizationSchema
        .nullable()
        .optional()
        .transform((value) => value ?? null),
    })
  ),
  money: z
    .object({
      subtotal: decimal,
      discount_total: decimal,
      shipping_fee: decimal,
      personalization_total: decimal,
      gift_wrap_fee: decimal,
      taxable_amount: decimal.optional(),
      vat: z.object({ rate: decimal, amount: decimal }).optional(),
      vat_amount: decimal.optional(),
      total: decimal,
      currency: text,
    })
    .transform((money, ctx) => {
      const amount = money.vat_amount ?? money.vat?.amount
      if (
        amount === undefined ||
        (money.vat_amount !== undefined && money.vat && money.vat_amount !== money.vat.amount)
      ) {
        ctx.addIssue({ code: 'custom', message: 'Missing or conflicting VAT amount' })
        return z.NEVER
      }
      return {
        ...money,
        taxable_amount: money.taxable_amount ?? null,
        vat: { rate: money.vat?.rate ?? null, amount },
      }
    }),
  coupon: z.unknown(),
  loyalty: rawOrderLoyaltySchema
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  payment: z.object({ method: text, status: text, reference: nullableText, paid_at: nullableText }),
  status_history: z.array(
    z.object({
      from_status: text.nullable(),
      to_status: text,
      note: nullableText,
      actor_type: text,
      actor_id: id.nullish().transform((value) => value ?? null),
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
