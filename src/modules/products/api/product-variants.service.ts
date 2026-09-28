import type {
  ProductVariant,
  ProductVariantCreatePayload,
  ProductVariantUpdatePayload,
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
  return { id: raw.id === undefined ? null : finiteNumber(raw.id, 'stock id'), warehouseId, quantity }
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
    isDefault: raw.is_default === undefined ? false : apiBoolean(raw.is_default),
    images: raw.images.map((image) => ({ id: finiteNumber(image.id, 'image id'), url: image.url })),
    warehouseStocks: raw.warehouse_stocks.map(normalizeVariantWarehouseStock),
  }
}

function serializeVariantFormData(payload: ProductVariantUpdatePayload) {
  const body = new FormData()
  if (payload.sku !== undefined) body.set('sku', payload.sku.trim())
  Object.entries(payload.attributes ?? {}).forEach(([key, value]) => body.set(`attributes[${key}]`, value))
  if (payload.priceOverride !== undefined)
    body.set('price_override', payload.priceOverride === null ? 'null' : String(payload.priceOverride))
  if (payload.isActive !== undefined) body.set('is_active', payload.isActive ? '1' : '0')
  payload.images?.forEach((image) => body.append('images[]', image))
  return body
}

function serializeVariantJson(payload: ProductVariantUpdatePayload) {
  return {
    ...(payload.sku !== undefined ? { sku: payload.sku.trim() } : {}),
    ...(payload.attributes !== undefined ? { attributes: payload.attributes } : {}),
    ...(payload.priceOverride !== undefined ? { price_override: payload.priceOverride } : {}),
    ...(payload.isActive !== undefined ? { is_active: payload.isActive ? 1 : 0 } : {}),
  }
}

export function serializeProductVariantCreate(payload: ProductVariantCreatePayload) {
  if (payload.priceOverride !== null && !Number.isFinite(payload.priceOverride)) {
    throw new Error('Product Variant price override is invalid')
  }
  return payload.images.length > 0
    ? serializeVariantFormData(payload)
    : serializeVariantJson({
        ...payload,
        priceOverride: payload.priceOverride === null ? undefined : payload.priceOverride,
      })
}

export function serializeProductVariantUpdate(payload: ProductVariantUpdatePayload) {
  if (
    payload.priceOverride !== undefined &&
    payload.priceOverride !== null &&
    !Number.isFinite(payload.priceOverride)
  ) {
    throw new Error('Product Variant price override is invalid')
  }
  return payload.images && payload.images.length > 0 ? serializeVariantFormData(payload) : serializeVariantJson(payload)
}

export const productVariantsHttpTransport = {
  async createVariant(productId: number, body: FormData | Record<string, unknown>) {
    const isFormData = body instanceof FormData
    return (
      await $http.post<ProductVariantResponse>({
        url: `/dashboard/products/${productId}/variants`,
        data: body,
        ...(isFormData ? { isFormData: true } : {}),
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async updateVariant(productId: number, variantId: number, body: FormData | Record<string, unknown>) {
    const isFormData = body instanceof FormData
    return (
      await $http.put<ProductVariantResponse>({
        url: `/dashboard/products/${productId}/variants/${variantId}`,
        data: body,
        ...(isFormData ? { isFormData: true } : {}),
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

export const productVariantsService = {
  async create(productId: number, payload: ProductVariantCreatePayload) {
    return normalizeProductVariant(
      (await productVariantsHttpTransport.createVariant(productId, serializeProductVariantCreate(payload))).data
    )
  },
  async update(productId: number, variantId: number, payload: ProductVariantUpdatePayload) {
    return normalizeProductVariant(
      (await productVariantsHttpTransport.updateVariant(productId, variantId, serializeProductVariantUpdate(payload)))
        .data
    )
  },
  delete: (productId: number, variantId: number) => productVariantsHttpTransport.deleteVariant(productId, variantId),
}
