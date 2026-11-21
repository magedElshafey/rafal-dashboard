import type { AffiliateFilters } from '@/modules/affiliates/types/affiliate.types'
import { emptyAffiliateFilters } from '@/modules/affiliates/utils/affiliate-filters'

export const affiliatesKeys = {
  all: ['affiliates'] as const,
  lists: () => [...affiliatesKeys.all, 'list'] as const,
  list: (filters: AffiliateFilters = emptyAffiliateFilters) => [...affiliatesKeys.lists(), filters] as const,
  details: () => [...affiliatesKeys.all, 'detail'] as const,
  detail: (id: number) => [...affiliatesKeys.details(), id] as const,
  activities: () => [...affiliatesKeys.all, 'activity'] as const,
  activity: (id: number) => [...affiliatesKeys.activities(), id] as const,
  settings: () => [...affiliatesKeys.all, 'settings'] as const,
  suggestions: () => [...affiliatesKeys.all, 'code-suggestion'] as const,
  suggestion: () => [...affiliatesKeys.suggestions(), 'current'] as const,
}
