import env from '@/config/env'
import { productsMockTransport } from '@/modules/products/mocks/products.mock'
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
  const body = new FormData()
  body.set('quantity', String(quantity))
  return body
}

export const productVariantStocksHttpTransport = {
  async putStock(productId: number, variantId: number, warehouseId: number, body: FormData) {
    return (
      await $http.put<VariantWarehouseStockResponse>({
        url: `/dashboard/products/${productId}/variants/${variantId}/stocks/${warehouseId}`,
        data: body,
        isFormData: true,
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

const transport = env.PRODUCTS_USE_MOCK ? productsMockTransport : productVariantStocksHttpTransport

export const productVariantStocksService = {
  async put(productId: number, variantId: number, warehouseId: number, quantity: number) {
    return normalizeVariantWarehouseStock(
      (await transport.putStock(productId, variantId, warehouseId, serializeVariantWarehouseStock(quantity))).data
    )
  },
  delete: (productId: number, variantId: number, warehouseId: number) =>
    transport.deleteStock(productId, variantId, warehouseId),
}
