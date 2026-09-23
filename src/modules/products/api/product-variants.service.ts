import env from '@/config/env'
import { productsMockTransport } from '@/modules/products/mocks/products.mock'
import type {
  ProductVariant,
  ProductVariantCreatePayload,
  ProductVariantDeleteResponse,
  ProductVariantResponse,
  JsonValue,
  RawProductVariant,
  RawVariantWarehouseStock,
  VariantWarehouseStock,
} from '@/modules/products/types/product-variant.types'
import { $http } from '@/utils/http'

function finiteNumber(value: number | string, field: string) {
  const normalized = typeof value === 'string' && value.trim() === '' ? Number.NaN : Number(value)
  if (!Number.isFinite(normalized)) throw new Error(`Product Variant ${field} is unavailable`)
  return normalized
}

export function normalizeVariantWarehouseStock(raw: RawVariantWarehouseStock): VariantWarehouseStock {
  const warehouseId = finiteNumber(raw.warehouse_id, 'warehouse id')
  const quantity = finiteNumber(raw.quantity, 'stock quantity')
  if (!Number.isInteger(warehouseId) || warehouseId <= 0 || !Number.isInteger(quantity) || quantity < 0) {
    throw new Error('Product Variant warehouse stock is unavailable')
  }
  return { warehouseId, quantity }
}

function apiBoolean(value: RawProductVariant['is_active']) {
  if (value === true || value === 1 || value === '1') return true
  if (value === false || value === 0 || value === '0') return false
  throw new Error('Product Variant active flag is unavailable')
}

function normalizeJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.map(normalizeJsonValue)
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeJsonValue(item)]))
  }
  throw new Error('Product Variant attributes are unavailable')
}

export function normalizeProductVariant(raw: RawProductVariant): ProductVariant {
  if (!Array.isArray(raw.images) || !Array.isArray(raw.warehouse_stocks)) {
    throw new Error('Product Variant data is unavailable')
  }
  return {
    id: finiteNumber(raw.id, 'id'),
    sku: raw.sku,
    attributes: normalizeJsonValue(raw.attributes),
    priceOverride: raw.price_override === null ? null : finiteNumber(raw.price_override, 'price override'),
    isActive: apiBoolean(raw.is_active),
    images: raw.images.map((image) => ({ id: finiteNumber(image.id, 'image id'), url: image.url })),
    warehouseStocks: raw.warehouse_stocks.map(normalizeVariantWarehouseStock),
  }
}

export function serializeProductVariantCreate(payload: ProductVariantCreatePayload) {
  if (payload.priceOverride !== null && !Number.isFinite(payload.priceOverride)) {
    throw new Error('Product Variant price override is invalid')
  }
  const body = new FormData()
  body.set('sku', payload.sku.trim())
  Object.entries(payload.attributes).forEach(([key, value]) => body.set(`attributes[${key}]`, value))
  if (payload.priceOverride !== null) body.set('price_override', String(payload.priceOverride))
  body.set('is_active', payload.isActive ? '1' : '0')
  payload.images.forEach((image) => body.append('images[]', image))
  return body
}

export const productVariantsHttpTransport = {
  async createVariant(productId: number, body: FormData) {
    return (
      await $http.post<ProductVariantResponse>({
        url: `/dashboard/products/${productId}/variants`,
        data: body,
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async deleteVariant(productId: number, variantId: number) {
    return (
      await $http.delete<ProductVariantDeleteResponse>({
        url: `/dashboard/products/${productId}/variants/${variantId}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}

const transport = env.PRODUCTS_USE_MOCK ? productsMockTransport : productVariantsHttpTransport

export const productVariantsService = {
  async create(productId: number, payload: ProductVariantCreatePayload) {
    return normalizeProductVariant(
      (await transport.createVariant(productId, serializeProductVariantCreate(payload))).data
    )
  },
  delete: (productId: number, variantId: number) => transport.deleteVariant(productId, variantId),
}
