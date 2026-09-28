import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { couponsService } from '@/modules/coupons/api/coupons.service'
import { couponsKeys } from '@/modules/coupons/queries/coupons.keys'

export function useCoupons() {
  return useInfinitePaginatedQuery({
    queryKey: couponsKeys.list(),
    queryFn: (page, signal) => couponsService.list(page, signal),
    retry: false,
  })
}
