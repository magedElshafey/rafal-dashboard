import { normalizeVariantWarehouseStock } from '@/modules/products/api/product-variants.service'
import type {
  VariantWarehouseStockDeleteResponse,
  VariantWarehouseStockResponse,
} from '@/modules/products/types/product-variant.types'
import { $http } from '@/utils/http'

export function serializeVariantWarehouseStock(quantity: number) {
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 0) {
    throw new Error('Product Variant stock quantity is invalid')
  }
  return { quantity }
}

export const productVariantStocksHttpTransport = {
  async putStock(productId: number, variantId: number, warehouseId: number, body: { quantity: number }) {
    return (
      await $http.put<VariantWarehouseStockResponse>({
        url: `/dashboard/products/${productId}/variants/${variantId}/stocks/${warehouseId}`,
        data: body,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async deleteStock(productId: number, variantId: number, warehouseId: number) {
    return (
      await $http.delete<VariantWarehouseStockDeleteResponse>({
        url: `/dashboard/products/${productId}/variants/${variantId}/stocks/${warehouseId}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}

export const productVariantStocksService = {
  async put(productId: number, variantId: number, warehouseId: number, quantity: number) {
    const response = await productVariantStocksHttpTransport.putStock(
      productId,
      variantId,
      warehouseId,
      serializeVariantWarehouseStock(quantity)
    )
    return response.data ? normalizeVariantWarehouseStock(response.data) : { id: null, warehouseId, quantity }
  },
  delete: (productId: number, variantId: number, warehouseId: number) =>
    productVariantStocksHttpTransport.deleteStock(productId, variantId, warehouseId),
}
