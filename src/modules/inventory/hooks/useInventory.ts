import { useQuery } from '@tanstack/react-query'
import { inventoryService } from '@/modules/inventory/api/inventory.service'
import { inventoryKeys } from '@/modules/inventory/queries/inventory.keys'

import type { InventoryFilters } from '../types/inventory.types'

export function useInventory(warehouseId: number, page: number, filters: InventoryFilters) {
  return useQuery({
    queryKey: inventoryKeys.list(warehouseId, page, filters),
    queryFn: ({ signal }) => inventoryService.list(warehouseId, page, signal, filters),
    staleTime: 0,
    retry: false,
  })
}
