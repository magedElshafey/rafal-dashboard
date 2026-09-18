import { useQuery } from '@tanstack/react-query'

import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { warehousesKeys } from '@/modules/warehouses/queries/warehouses.keys'

export function useWarehouse(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: warehousesKeys.detail(id ?? 0),
    queryFn: ({ signal }) => warehousesService.show(id as number, signal),
    enabled: enabled && id !== null,
    staleTime: 0,
    retry: false,
  })
}
