import { isAffiliateFeatureEnabled, isAffiliateSettingsWriteReady } from '@/modules/affiliates/config/affiliate-feature'
import {
  affiliateCreateSchema,
  affiliatePasswordResetSchema,
  affiliateResponseSchema,
  affiliateSettingsResponseSchema,
  affiliatesIndexSchema,
  successSchema,
} from '@/modules/affiliates/schemas/affiliate-api.schema'
import type {
  Affiliate,
  AffiliateFilters,
  AffiliateSettings,
  CreateAffiliatePayload,
  UpdateAffiliatePayload,
  UpdateAffiliateSettingsPayload,
} from '@/modules/affiliates/types/affiliate.types'
import { emptyAffiliateFilters, serializeAffiliateFilters } from '@/modules/affiliates/utils/affiliate-filters'
import { $http } from '@/utils/http'

const silent = { suppressErrorNotification: true, suppressSuccessNotification: true }
export function assertAffiliateAccess() {
  if (!isAffiliateFeatureEnabled) throw new Error('Affiliate access is unavailable')
}
export function normalizeAffiliatePhone(value: string) {
  const phone = value.trim().replace(/^(?:\+966|00966|966|0)/, '')
  if (!/^5\d{8}$/.test(phone)) throw new Error('Invalid Saudi phone')
  return `+966${phone}`
}
function profilePayload(values: UpdateAffiliatePayload) {
  return {
    ...(values.name === undefined ? {} : { name: values.name }),
    ...(values.mobile === undefined ? {} : { phone: normalizeAffiliatePhone(values.mobile) }),
    ...(values.email === undefined ? {} : { email: values.email }),
    ...(values.platform === undefined ? {} : { platform: values.platform }),
    ...(values.username === undefined ? {} : { account_handle: values.username }),
  }
}
function settingsData(raw: ReturnType<typeof affiliateSettingsResponseSchema.parse>['data']): AffiliateSettings {
  return {
    programEnabled: raw.enabled,
    applicationsEnabled: raw.applications_enabled,
    customerDiscountPercentage: raw.customer_discount_percent,
    affiliateCommissionPercentage: raw.commission_percent,
    minimumPayoutAmount: String(raw.min_payout),
    termsPageId: raw.terms_page_id,
  }
}
export const affiliatesService = {
  async getSettings(signal?: AbortSignal) {
    assertAffiliateAccess()
    const response = await $http.get({ url: '/dashboard/affiliate-settings', signal, ...silent })
    return settingsData(affiliateSettingsResponseSchema.parse(response.data).data)
  },
  async updateSettings(values: UpdateAffiliateSettingsPayload) {
    assertAffiliateAccess()
    if (
      !isAffiliateSettingsWriteReady ||
      !Number.isSafeInteger(values.termsPageId) ||
      !values.termsPageId ||
      values.termsPageId < 1
    )
      throw new Error('Settings save contract unavailable')
    const response = await $http.put({
      url: '/dashboard/affiliate-settings',
      data: {
        enabled: values.programEnabled,
        applications_enabled: values.applicationsEnabled,
        customer_discount_percent: values.customerDiscountPercentage,
        commission_percent: values.affiliateCommissionPercentage,
        min_payout: Number(values.minimumPayoutAmount),
        terms_page_id: values.termsPageId,
      },
      ...silent,
    })
    return settingsData(affiliateSettingsResponseSchema.parse(response.data).data)
  },
  async list(page: number, signal?: AbortSignal, filters: AffiliateFilters = emptyAffiliateFilters) {
    assertAffiliateAccess()
    const response = await $http.get({
      url: '/dashboard/affiliates',
      query: { page, per_page: 25, ...serializeAffiliateFilters(filters) },
      signal,
      ...silent,
    })
    const parsed = affiliatesIndexSchema.parse(response.data)
    return {
      items: parsed.data.map((raw) => ({
        id: raw.id,
        name: raw.name,
        mobile: raw.phone,
        email: raw.email,
        code: raw.code,
        status: raw.status,
        createdAt: raw.created_at,
        source: raw.source,
        ordersCount: raw.orders_count,
        pending: raw.pending,
        approvedUnpaid: raw.approved_unpaid,
        paid: raw.paid,
      })),
      paginate: {
        current_page: parsed.meta.current_page,
        total_pages: parsed.meta.last_page,
        per_page: parsed.meta.per_page,
        total: parsed.meta.total,
        count: parsed.data.length,
        next_page_url: parsed.meta.current_page < parsed.meta.last_page ? String(parsed.meta.current_page + 1) : null,
        prev_page_url: parsed.meta.current_page > 1 ? String(parsed.meta.current_page - 1) : null,
      },
      extra: parsed.meta.totals,
    }
  },
  async export(filters: AffiliateFilters, signal?: AbortSignal) {
    assertAffiliateAccess()
    const response = await $http.get<Blob>({
      url: '/dashboard/affiliates/export',
      query: serializeAffiliateFilters(filters),
      responseType: 'blob',
      signal,
      ...silent,
    })
    if (
      !(response.data instanceof Blob) ||
      !response.data.size ||
      !/^(text\/csv|application\/csv)(;|$)/i.test(response.data.type)
    )
      throw new Error('Invalid CSV response')
    return response
  },
  async create(values: CreateAffiliatePayload) {
    assertAffiliateAccess()
    const code = values.code.trim()
    const response = await $http.post({
      url: '/dashboard/affiliates',
      data: { ...profilePayload(values), ...(code ? { code } : {}) },
      ...silent,
    })
    return affiliateCreateSchema.parse(response.data).data
  },
  async show(id: number, signal?: AbortSignal, range: { from?: string; to?: string } = {}): Promise<Affiliate> {
    assertAffiliateAccess()
    const response = await $http.get({ url: `/dashboard/affiliates/${id}`, query: range, signal, ...silent })
    const raw = affiliateResponseSchema.parse(response.data).data
    if (raw.id !== id) throw new Error('Unexpected Affiliate identity')
    return {
      id: raw.id,
      name: raw.name,
      mobile: raw.phone,
      email: raw.email,
      code: raw.code,
      status: raw.status,
      createdAt: raw.created_at,
      platform: raw.platform ?? '',
      username: raw.account_handle ?? '',
      updatedAt: raw.updated_at ?? '',
      source: raw.source,
      applicationId: raw.application_id,
      lastLoginAt: raw.last_login_at,
      termsAcceptedAt: raw.terms_accepted_at,
    }
  },
  async update(id: number, values: UpdateAffiliatePayload) {
    assertAffiliateAccess()
    const response = await $http.put({ url: `/dashboard/affiliates/${id}`, data: profilePayload(values), ...silent })
    successSchema.parse(response.data)
  },
  async suspend(id: number, reason: string) {
    assertAffiliateAccess()
    if (reason.trim().length < 10 || reason.trim().length > 250) throw new Error('Invalid suspension reason')
    const response = await $http.post({
      url: `/dashboard/affiliates/${id}/suspend`,
      data: { reason: reason.trim() },
      ...silent,
    })
    successSchema.parse(response.data)
  },
  async reactivate(id: number, reason: string) {
    assertAffiliateAccess()
    if (!reason.trim()) throw new Error('Reactivation reason required')
    const response = await $http.post({
      url: `/dashboard/affiliates/${id}/reactivate`,
      data: { reason: reason.trim() },
      ...silent,
    })
    successSchema.parse(response.data)
  },
  async resetPassword(id: number) {
    assertAffiliateAccess()
    const response = await $http.post({ url: `/dashboard/affiliates/${id}/reset-password`, ...silent })
    return affiliatePasswordResetSchema.parse(response.data).data
  },
}
