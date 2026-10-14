export const inventoryKeys = {
  all: ['inventory'] as const,
  list: (warehouseId: number, page: number) => [...inventoryKeys.all, 'list', warehouseId, page] as const,
}
