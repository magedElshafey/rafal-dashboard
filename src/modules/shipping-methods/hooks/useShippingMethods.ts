import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { shippingMethodsService } from '@/modules/shipping-methods/api/shipping-methods.service'
import { shippingMethodsKeys } from '@/modules/shipping-methods/queries/shipping-methods.keys'
import type { ShippingMethodsFilters } from '@/modules/shipping-methods/types/shipping-method.types'
import { emptyShippingMethodsFilters } from '@/modules/shipping-methods/utils/shipping-method-filters'

export function useShippingMethods(filters: ShippingMethodsFilters = emptyShippingMethodsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: shippingMethodsKeys.list(filters),
    queryFn: (page, signal) => shippingMethodsService.list(page, signal, filters),
    retry: false,
  })
}
