import type {
  ShippingMethodsFilters,
  ShippingMethodSortBy,
  ShippingMethodSortDir,
} from '../types/shipping-method.types'

export const shippingMethodSortValues: ShippingMethodSortBy[] = ['sort_order', 'code', 'created_at']
export const shippingMethodSortDirections: ShippingMethodSortDir[] = ['asc', 'desc']
export const shippingMethodFilterNames = ['sort_by', 'sort_dir']

export const emptyShippingMethodsFilters: ShippingMethodsFilters = {
  sortBy: null,
  sortDir: null,
}

export function readShippingMethodsFilters(query: Record<string, string> | null): ShippingMethodsFilters {
  const sortBy = query?.sort_by as ShippingMethodSortBy | undefined
  const sortDir = query?.sort_dir as ShippingMethodSortDir | undefined
  return {
    sortBy: sortBy && shippingMethodSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && shippingMethodSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function serializeShippingMethodsFilters(filters: ShippingMethodsFilters) {
  return {
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
