import axios, { type AxiosInstance } from 'axios'

import { affiliateMockConfig, isAffiliateFeatureEnabled } from '@/modules/affiliates/config/affiliate-feature'
import {
  affiliateActivitySchema,
  affiliatePasswordResetSchema,
  affiliateResponseSchema,
  affiliateSuggestionSchema,
  affiliatesIndexSchema,
} from '@/modules/affiliates/schemas/affiliate-api.schema'
import type {
  Affiliate,
  AffiliateAuditEvent,
  AffiliateFilters,
  AffiliatePasswordReset,
  CreateAffiliatePayload,
  UpdateAffiliatePayload,
} from '@/modules/affiliates/types/affiliate.types'
import { emptyAffiliateFilters, serializeAffiliateFilters } from '@/modules/affiliates/utils/affiliate-filters'

const AFFILIATES_PER_PAGE = 15

type RawAffiliate = ReturnType<typeof affiliateResponseSchema.parse>['data']

function toAffiliate(raw: RawAffiliate): Affiliate {
  return {
    id: raw.id,
    name: raw.name,
    mobile: raw.mobile,
    email: raw.email,
    platform: raw.platform,
    username: raw.username,
    code: raw.code,
    status: raw.status,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function createAffiliateMockClient(baseUrl: string, token: string): AxiosInstance {
  return axios.create({
    baseURL: baseUrl,
    withCredentials: false,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

const affiliateHttp = createAffiliateMockClient(affiliateMockConfig.baseUrl, affiliateMockConfig.token)

function assertAffiliateFeatureEnabled() {
  if (!isAffiliateFeatureEnabled) throw new Error('Affiliate mock API is not configured for development')
}

export const affiliatesService = {
  async list(
    page: number,
    signal?: AbortSignal,
    filters: AffiliateFilters = emptyAffiliateFilters
  ): Promise<PaginatedData<Affiliate>> {
    assertAffiliateFeatureEnabled()
    const response = await affiliateHttp.get('/dashboard/affiliates', {
      params: { page, per_page: AFFILIATES_PER_PAGE, ...serializeAffiliateFilters(filters) },
      signal,
    })
    const parsed = affiliatesIndexSchema.parse(response.data)
    return {
      items: parsed.data.map(toAffiliate),
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

  async create(payload: CreateAffiliatePayload): Promise<Affiliate> {
    assertAffiliateFeatureEnabled()
    const response = await affiliateHttp.post('/dashboard/affiliates', payload)
    return toAffiliate(affiliateResponseSchema.parse(response.data).data)
  },

  async show(id: number, signal?: AbortSignal): Promise<Affiliate> {
    assertAffiliateFeatureEnabled()
    const response = await affiliateHttp.get(`/dashboard/affiliates/${id}`, { signal })
    return toAffiliate(affiliateResponseSchema.parse(response.data).data)
  },

  async update(id: number, payload: UpdateAffiliatePayload): Promise<Affiliate> {
    assertAffiliateFeatureEnabled()
    const response = await affiliateHttp.patch(`/dashboard/affiliates/${id}`, payload)
    return toAffiliate(affiliateResponseSchema.parse(response.data).data)
  },

  async suspend(id: number): Promise<Affiliate> {
    assertAffiliateFeatureEnabled()
    const response = await affiliateHttp.post(`/dashboard/affiliates/${id}/suspend`)
    return toAffiliate(affiliateResponseSchema.parse(response.data).data)
  },

  async reactivate(id: number): Promise<Affiliate> {
    assertAffiliateFeatureEnabled()
    const response = await affiliateHttp.post(`/dashboard/affiliates/${id}/reactivate`)
    return toAffiliate(affiliateResponseSchema.parse(response.data).data)
  },

  async resetPassword(id: number): Promise<AffiliatePasswordReset> {
    assertAffiliateFeatureEnabled()
    const response = await affiliateHttp.post(`/dashboard/affiliates/${id}/reset-password`)
    const data = affiliatePasswordResetSchema.parse(response.data).data
    return {
      affiliateId: data.affiliate_id,
      deliveryStatus: data.delivery_status,
      channel: data.channel,
      requiresPasswordChange: data.requires_password_change,
      requestedAt: data.requested_at,
    }
  },

  async activity(id: number, signal?: AbortSignal): Promise<AffiliateAuditEvent[]> {
    assertAffiliateFeatureEnabled()
    const response = await affiliateHttp.get(`/dashboard/affiliates/${id}/activity`, { signal })
    return affiliateActivitySchema.parse(response.data).data.map((event) => ({
      id: event.id,
      affiliateId: event.affiliate_id,
      action: event.action,
      actor: event.actor,
      previousState: event.previous_state,
      newState: event.new_state,
      createdAt: event.created_at,
    }))
  },

  async suggestCode(signal?: AbortSignal) {
    assertAffiliateFeatureEnabled()
    const response = await affiliateHttp.get('/dashboard/affiliates/code-suggestion', { signal })
    return affiliateSuggestionSchema.parse(response.data).data
  },
}
