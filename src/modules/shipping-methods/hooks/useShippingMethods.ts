import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { shippingMethodsService } from '@/modules/shipping-methods/api/shipping-methods.service'
import { shippingMethodsKeys } from '@/modules/shipping-methods/queries/shipping-methods.keys'

export function useShippingMethods() {
  return useInfinitePaginatedQuery({
    queryKey: shippingMethodsKeys.list(),
    queryFn: (page, signal) => shippingMethodsService.list(page, signal),
    retry: false,
  })
}
