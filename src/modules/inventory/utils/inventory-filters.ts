import type { InventoryFilters } from '../types/inventory.types'

export const inventoryFilterNames = ['product_id', 'stock_status', 'sort_by', 'sort_dir']
export const inventoryStockStatuses = ['in_stock', 'low_stock', 'out_of_stock'] as const
export const inventorySortFields = ['quantity', 'product', 'warehouse', 'updated_at'] as const
export const inventorySortDirections = ['asc', 'desc'] as const

export function normalizeInventoryFilters(filters: Partial<InventoryFilters> = {}): InventoryFilters {
  return {
    search: filters.search?.trim() ?? '',
    productId: filters.productId != null && Number.isSafeInteger(filters.productId) && filters.productId > 0 ? filters.productId : null,
    stockStatus: inventoryStockStatuses.find(value => value === filters.stockStatus) ?? null,
    sortBy: inventorySortFields.find(value => value === filters.sortBy) ?? null,
    sortDir: inventorySortDirections.find(value => value === filters.sortDir) ?? null,
  }
}

export function readInventoryFilters(query: Record<string, string> | null): InventoryFilters {
  const product = query?.product_id?.trim() ?? ''
  return normalizeInventoryFilters({
    search: query?.search,
    productId: /^\d+$/.test(product) ? Number(product) : null,
    stockStatus: inventoryStockStatuses.find(value => value === query?.stock_status),
    sortBy: inventorySortFields.find(value => value === query?.sort_by),
    sortDir: inventorySortDirections.find(value => value === query?.sort_dir),
  })
}

export function serializeInventoryFilters(filters: Partial<InventoryFilters> = {}) {
  if (filters.productId != null && (!Number.isSafeInteger(filters.productId) || filters.productId <= 0)) {
    throw new Error('Invalid inventory product ID')
  }
  const normalized = normalizeInventoryFilters(filters)
  return {
    ...(normalized.search ? { search: normalized.search } : {}),
    ...(normalized.productId !== null ? { product_id: normalized.productId } : {}),
    ...(normalized.stockStatus ? { stock_status: normalized.stockStatus } : {}),
    ...(normalized.sortBy ? { sort_by: normalized.sortBy } : {}),
    ...(normalized.sortDir ? { sort_dir: normalized.sortDir } : {}),
  }
}
