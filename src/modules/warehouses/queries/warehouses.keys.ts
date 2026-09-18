export const warehousesKeys = {
  all: ['warehouses'] as const,
  lists: () => [...warehousesKeys.all, 'list'] as const,
  list: () => [...warehousesKeys.lists()] as const,
  details: () => [...warehousesKeys.all, 'detail'] as const,
  detail: (id: number) => [...warehousesKeys.details(), id] as const,
}
