import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { warehousesKeys } from '@/modules/warehouses/queries/warehouses.keys'
import type { WarehousesFilters } from '@/modules/warehouses/types/warehouse.types'
import { emptyWarehousesFilters, validWarehousesCreatedRange } from '@/modules/warehouses/utils/warehouse-filters'

export function useWarehouses(filters: WarehousesFilters = emptyWarehousesFilters) {
  return useInfinitePaginatedQuery({
    queryKey: warehousesKeys.list(filters),
    queryFn: (page, signal) => warehousesService.list(page, signal, filters),
    enabled: validWarehousesCreatedRange(filters),
    retry: false,
  })
}
