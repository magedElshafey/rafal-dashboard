import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { couponsService } from '@/modules/coupons/api/coupons.service'
import { couponsKeys } from '@/modules/coupons/queries/coupons.keys'
import type { CouponsFilters } from '@/modules/coupons/types/coupon.types'
import { emptyCouponsFilters, validCouponsDateRange } from '@/modules/coupons/utils/coupon-filters'

export function useCoupons(filters: CouponsFilters = emptyCouponsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: couponsKeys.list(filters),
    queryFn: (page, signal) => couponsService.list(page, signal, filters),
    enabled: validCouponsDateRange(filters),
    retry: false,
  })
}
