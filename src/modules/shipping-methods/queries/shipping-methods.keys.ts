import type { ShippingMethodsFilters } from '../types/shipping-method.types'
import { emptyShippingMethodsFilters } from '../utils/shipping-method-filters'

export const shippingMethodsKeys = {
  all: ['shipping-methods'] as const,
  lists: () => [...shippingMethodsKeys.all, 'list'] as const,
  list: (filters: ShippingMethodsFilters = emptyShippingMethodsFilters) =>
    [...shippingMethodsKeys.lists(), filters] as const,
}
