import { useQuery } from '@tanstack/react-query'
import { inventoryService } from '@/modules/inventory/api/inventory.service'
import { inventoryKeys } from '@/modules/inventory/queries/inventory.keys'

export function useInventory(warehouseId: number, page: number) {
  return useQuery({
    queryKey: inventoryKeys.list(warehouseId, page),
    queryFn: ({ signal }) => inventoryService.list(warehouseId, page, signal),
    staleTime: 0,
    retry: false,
  })
}
