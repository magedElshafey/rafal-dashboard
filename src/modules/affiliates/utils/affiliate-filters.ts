import type { AffiliateFilters, AffiliateStatus } from '@/modules/affiliates/types/affiliate.types'

export const affiliateStatuses: AffiliateStatus[] = ['active', 'suspended']
export const affiliateFilterNames = ['status']

export const emptyAffiliateFilters: AffiliateFilters = { search: '', status: null }

export function readAffiliateFilters(query: Record<string, string> | null): AffiliateFilters {
  const search = query?.search?.trim() ?? ''
  const status = affiliateStatuses.includes(query?.status as AffiliateStatus)
    ? (query?.status as AffiliateStatus)
    : null
  return { search, status }
}

export function serializeAffiliateFilters(filters: AffiliateFilters) {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  }
}
