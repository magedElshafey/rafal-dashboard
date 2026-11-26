import type { AffiliateFilters } from '@/modules/affiliates/types/affiliate.types'
import { emptyAffiliateFilters } from '@/modules/affiliates/utils/affiliate-filters'

export const affiliatesKeys = {
  all: ['affiliates'] as const,
  lists: () => [...affiliatesKeys.all, 'list'] as const,
  list: (filters: AffiliateFilters = emptyAffiliateFilters) => [...affiliatesKeys.lists(), filters] as const,
  details: () => [...affiliatesKeys.all, 'detail'] as const,
  detail: (id: number) => [...affiliatesKeys.details(), id] as const,
  period: (id: number, range: { from?: string; to?: string; orders_page?: number; payouts_page?: number }) =>
    [...affiliatesKeys.detail(id), range] as const,
  settings: () => [...affiliatesKeys.all, 'settings'] as const,
}
