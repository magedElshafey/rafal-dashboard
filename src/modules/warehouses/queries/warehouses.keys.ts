import type { WarehousesFilters } from '../types/warehouse.types'

export const warehousesKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehousesKeys.all, 'list'] as const,
  list: (filters: WarehousesFilters) => [...warehousesKeys.lists(), filters] as const,
  details: () => [...warehousesKeys.all, 'detail'] as const,
  detail: (id: number) => [...warehousesKeys.details(), id] as const,
}
