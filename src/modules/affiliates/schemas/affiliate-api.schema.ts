import { z } from 'zod'

const id = z.number().int().positive().safe()
const money = z.string().regex(/^-?\d+\.\d{2}$/)
export const successSchema = z.object({ success: z.literal(true), message: z.string(), data: z.unknown() })
export const affiliateSchema = z.object({
  id,
  name: z.string().min(1),
  phone: z.string(),
  email: z.string(),
  code: z.string(),
  status: z.enum(['active', 'suspended']),
  created_at: z.string(),
})
export const affiliateDetailSchema = affiliateSchema.extend({
  platform: z.string().nullish(),
  account_handle: z.string().nullish(),
  updated_at: z.string().nullish(),
  source: z.string().nullish(),
  application_id: id.nullish(),
  last_login_at: z.string().nullish(),
  terms_accepted_at: z.string().nullish(),
})
export const affiliateListSchema = affiliateSchema.extend({
  source: z.string(),
  orders_count: z.number().int().nonnegative(),
  pending: money,
  approved_unpaid: money,
  paid: money,
})
export const paginationSchema = z.object({
  current_page: id,
  last_page: id,
  per_page: id,
  total: z.number().int().nonnegative(),
})
export const affiliateTotalsSchema = z.object({
  pending: money,
  approved_unpaid: money,
  paid_this_month: money,
  open_requests: z.object({ count: z.number().int().nonnegative().safe(), amount: money }),
})
export const affiliatesIndexSchema = successSchema.extend({
  data: z.array(affiliateListSchema),
  meta: paginationSchema.extend({ totals: affiliateTotalsSchema.nullable().catch(null) }),
})
export const affiliateResponseSchema = successSchema.extend({ data: affiliateDetailSchema })
export const smsSchema = z.object({ sms_sent: z.boolean(), sms_message: z.string().nullable() })
export const affiliatePasswordResetSchema = successSchema.extend({ data: smsSchema })
export const affiliateCreateSchema = successSchema.extend({ data: smsSchema.extend({ affiliate: z.object({ id }) }) })
// Both representations are evidenced by the approved guide extraction (general money strings / numeric settings example).
const payout = z.union([
  z.number().finite().min(0).max(10000),
  z
    .string()
    .regex(/^\d+(?:\.\d+)?$/)
    .refine((v) => Number(v) <= 10000),
])
export const affiliateSettingsResponseSchema = successSchema.extend({
  data: z.object({
    enabled: z.boolean(),
    applications_enabled: z.boolean(),
    customer_discount_percent: z.number().min(1).max(50),
    commission_percent: z.number().min(0.5).max(50),
    min_payout: payout,
    terms_page_id: id.nullable(),
    terms_page: z.unknown(),
  }),
})
