import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { warehousesKeys } from '@/modules/warehouses/queries/warehouses.keys'

export function useWarehouses() {
  return useInfinitePaginatedQuery({
    queryKey: warehousesKeys.list(),
    queryFn: (page, signal) => warehousesService.list(page, signal),
    retry: false,
  })
}
