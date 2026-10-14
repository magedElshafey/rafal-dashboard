import type { ProductListItem } from '@/modules/products/types/product.types'
import type { ProductVariant, VariantWarehouseStock } from '@/modules/products/types/product-variant.types'
import type { WarehouseListItem } from '@/modules/warehouses/types/warehouse.types'
import type { DashboardPaginationMeta } from '@/types/dashboard-api.types'

// Endpoint projection of existing entities, not a separate editable stock store.
export type InventoryStock = Pick<VariantWarehouseStock, 'quantity'> & {
  id: number
  stockStatus: string
  warehouse: Pick<WarehouseListItem, 'id' | 'name'>
  product: Pick<ProductListItem, 'id' | 'sku' | 'name' | 'isActive'>
  variant: Pick<ProductVariant, 'id' | 'sku' | 'attributes' | 'isActive' | 'isDefault'>
  updatedAt: string
}

export type InventoryPage = {
  items: InventoryStock[]
  meta: DashboardPaginationMeta & { low_stock_threshold: number }
}
