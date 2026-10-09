import type { CouponsFilters } from '../types/coupon.types'
import { emptyCouponsFilters } from '../utils/coupon-filters'

export const couponsKeys = {
  all: ['coupons'] as const,
  lists: () => [...couponsKeys.all, 'list'] as const,
  list: (filters: CouponsFilters = emptyCouponsFilters) => [...couponsKeys.lists(), filters] as const,
}
