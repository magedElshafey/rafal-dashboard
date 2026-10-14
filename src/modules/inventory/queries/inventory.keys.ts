import type { InventoryFilters } from '../types/inventory.types'
import { normalizeInventoryFilters } from '../utils/inventory-filters'

export const inventoryKeys = {
  all: ['inventory'] as const,
  list: (warehouseId: number, page: number, filters: Partial<InventoryFilters> = {}) =>
    [...inventoryKeys.all, 'list', warehouseId, page, normalizeInventoryFilters(filters)] as const,
}
