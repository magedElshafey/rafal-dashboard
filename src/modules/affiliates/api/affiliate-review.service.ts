import { isAffiliatePayoutFeatureEnabled, isAffiliatePayoutDecisionReady } from '../config/affiliate-feature'
import { payoutPaidSchema, payoutRejectSchema, type PayoutPaidPayload } from '../schemas/affiliate-payout.schema'
import { z } from 'zod'
import { isAxiosError } from 'axios'
import { $http } from '@/utils/http'
import { assertAffiliateAccess } from './affiliates.service'
import { paginationSchema, successSchema, affiliateCreateSchema, optionalMoney } from '../schemas/affiliate-api.schema'
const id = z.number().int().positive().safe()
const applicationSchema = z.object({
  id,
  name: z.string(),
  phone: z.string(),
  platform: z.string(),
  followers_range: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  created_at: z.string(),
})
const applicationIndex = successSchema.extend({
  data: z.array(applicationSchema),
  meta: paginationSchema.extend({ pending_count: z.number().int().nonnegative() }),
})
const applicationDetail = successSchema.extend({
  data: applicationSchema.extend({
    customer: z.object({
      id,
      name: z.string(),
      phone: z.string(),
      account_email: z.string().nullable(),
      customer_since: z.string(),
      orders_count: z.number().int().nonnegative(),
    }),
    email: z.string().nullish(),
    account_handle: z.string().nullish(),
    promotion_plan: z.string().nullish(),
    proposed_code: z.string().nullish(),
    suggested_code_unavailable: z.boolean().optional(),
    suggested_code_message: z.string().nullish(),
    rejection_reason: z.string().nullish(),
    decided_at: z.string().nullish(),
  }),
})
const payoutSchema = z.object({
  id,
  status: z.enum(['pending', 'paid', 'rejected']),
  affiliate: z.object({ id, name: z.string(), code: z.string() }),
  iban: z.string(),
  amount: optionalMoney,
  created_at: z.string().nullish(),
  transfer_reference: z.string().nullish(),
  transferred_at: z.string().nullish(),
  rejection_reason: z.string().nullish(),
})
const payoutIndex = successSchema.extend({ data: z.array(payoutSchema), meta: paginationSchema })
const silent = { suppressErrorNotification: true, suppressSuccessNotification: true }
export type AffiliateApplication = z.infer<typeof applicationSchema>
export type AffiliatePayout = z.infer<typeof payoutSchema>
// A pending read cannot prove that a timed-out request will never commit.
// Keep consumed/uncertain payout IDs blocked across dialog and session changes.
// No automatic client-side reset: resolution requires authoritative operational reconciliation.
const decisions = new Set<number>()
async function decide(id: number, operation: () => Promise<unknown>) {
  if (decisions.has(id)) throw new Error('Payout decision requires reconciliation')
  decisions.add(id)
  try {
    await operation()
  } catch (error) {
    if (isAxiosError(error) && error.response && [400, 401, 403, 404, 422].includes(error.response.status))
      decisions.delete(id)
    throw error
  }
}
export const affiliateApplicationsService = {
  async show(id: number, signal?: AbortSignal) {
    assertAffiliateAccess()
    const response = await $http.get({ url: `/dashboard/affiliate-applications/${id}`, signal, ...silent })
    const result = applicationDetail.parse(response.data).data
    if (result.id !== id) throw new Error('Unexpected application identity')
    return result
  },
  async approve(id: number, code: string) {
    assertAffiliateAccess('manage')
    if (!/^[A-Za-z0-9]{4,20}$/.test(code)) throw new Error('Invalid Affiliate code')
    const response = await $http.post({
      url: `/dashboard/affiliate-applications/${id}/approve`,
      data: { code },
      ...silent,
    })
    return affiliateCreateSchema.parse(response.data).data
  },
  async reject(id: number, reason: string) {
    assertAffiliateAccess('manage')
    if (reason.trim().length < 10 || reason.trim().length > 250) throw new Error('Invalid rejection reason')
    const response = await $http.post({
      url: `/dashboard/affiliate-applications/${id}/reject`,
      data: { reason: reason.trim() },
      ...silent,
    })
    return successSchema.parse(response.data).message
  },
  async list(page: number, signal?: AbortSignal, status?: string) {
    assertAffiliateAccess()
    const response = await $http.get({
      url: '/dashboard/affiliate-applications',
      query: { page, status },
      signal,
      ...silent,
    })
    const parsed = applicationIndex.parse(response.data)
    return {
      items: parsed.data,
      paginate: {
        current_page: parsed.meta.current_page,
        total_pages: parsed.meta.last_page,
        per_page: parsed.meta.per_page,
        total: parsed.meta.total,
        count: parsed.data.length,
        next_page_url: parsed.meta.current_page < parsed.meta.last_page ? String(parsed.meta.current_page + 1) : null,
        prev_page_url: parsed.meta.current_page > 1 ? String(parsed.meta.current_page - 1) : null,
      },
      extra: { pendingCount: parsed.meta.pending_count },
    }
  },
}
export const affiliatePayoutsService = {
  isDecisionBlocked(id: number) {
    return decisions.has(id)
  },
  async paid(id: number, payload: PayoutPaidPayload) {
    assertAffiliateAccess('payouts')
    if (!isAffiliatePayoutFeatureEnabled || !isAffiliatePayoutDecisionReady)
      throw new Error('Payout decisions unavailable')
    const data = payoutPaidSchema.parse(payload)
    await decide(id, async () => {
      const response = await $http.post({ url: `/dashboard/affiliate-payouts/${id}/paid`, data, ...silent })
      // A common acknowledgment is not evidence of a completed financial transition.
      // Keep activation closed pending the financial result contract; always reread server state.
      successSchema.parse(response.data)
    })
  },
  async reject(id: number, reason: string) {
    assertAffiliateAccess('payouts')
    if (!isAffiliatePayoutFeatureEnabled || !isAffiliatePayoutDecisionReady)
      throw new Error('Payout decisions unavailable')
    const data = payoutRejectSchema.parse({ reason })
    await decide(id, async () => {
      const response = await $http.post({ url: `/dashboard/affiliate-payouts/${id}/reject`, data, ...silent })
      successSchema.parse(response.data)
    })
  },
  async show(id: number, signal?: AbortSignal) {
    if (!isAffiliatePayoutFeatureEnabled) throw new Error('Payout access is unavailable')
    assertAffiliateAccess('payouts')
    const response = await $http.get({ url: `/dashboard/affiliate-payouts/${id}`, signal, ...silent })
    const result = successSchema
      .extend({
        data: z.object({
          payout: payoutSchema.partial().required({ id: true, status: true }),
          affiliate_available_balance: optionalMoney,
          warning: z.string().nullish(),
        }),
      })
      .parse(response.data).data
    if (result.payout.id !== id) throw new Error('Unexpected payout identity')
    if (result.payout.status !== 'pending') decisions.add(id)
    return result
  },
  async list(page: number, signal?: AbortSignal, status?: string) {
    if (!isAffiliatePayoutFeatureEnabled) throw new Error('Payout access is unavailable')
    assertAffiliateAccess('payouts')
    const response = await $http.get({
      url: '/dashboard/affiliate-payouts',
      query: { page, status, per_page: 25 },
      signal,
      ...silent,
    })
    const parsed = payoutIndex.parse(response.data)
    return {
      items: parsed.data,
      paginate: {
        current_page: parsed.meta.current_page,
        total_pages: parsed.meta.last_page,
        per_page: parsed.meta.per_page,
        total: parsed.meta.total,
        count: parsed.data.length,
        next_page_url: parsed.meta.current_page < parsed.meta.last_page ? String(parsed.meta.current_page + 1) : null,
        prev_page_url: parsed.meta.current_page > 1 ? String(parsed.meta.current_page - 1) : null,
      },
      extra: null,
    }
  },
}
