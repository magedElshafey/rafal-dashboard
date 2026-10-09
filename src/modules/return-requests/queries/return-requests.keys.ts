import type { ReturnRequestsFilters } from '../types/return-request.types'
import { emptyReturnRequestsFilters } from '../utils/return-request-filters'

export const returnRequestsKeys = {
  all: ['return-requests'] as const,
  lists: () => [...returnRequestsKeys.all, 'list'] as const,
  list: (filters: ReturnRequestsFilters = emptyReturnRequestsFilters) =>
    [...returnRequestsKeys.lists(), filters] as const,
  details: () => [...returnRequestsKeys.all, 'detail'] as const,
  detail: (id: number) => [...returnRequestsKeys.details(), id] as const,
}
