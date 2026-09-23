import type { ImageUploadValue } from '@/components/form/image-upload'

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export type RawVariantWarehouseStock = {
  warehouse_id: number | string
  quantity: number | string
}

export type VariantWarehouseStock = {
  warehouseId: number
  quantity: number
}

export type RawProductVariant = {
  id: number | string
  sku: string
  attributes: JsonValue
  price_override: number | string | null
  is_active: boolean | 0 | 1 | '0' | '1'
  images: Array<{ id: number | string; url: string }>
  warehouse_stocks: RawVariantWarehouseStock[]
}

export type ProductVariant = {
  id: number
  sku: string
  attributes: JsonValue
  priceOverride: number | null
  isActive: boolean
  images: Array<{ id: number; url: string }>
  warehouseStocks: VariantWarehouseStock[]
}

export type VariantAttributeRow = { key: string; value: string }

export type ProductVariantFormValues = {
  sku: string
  attributes: VariantAttributeRow[]
  priceOverride: number | null
  isActive: boolean
  images: ImageUploadValue
}

export type ProductVariantCreatePayload = {
  sku: string
  attributes: Record<string, string>
  priceOverride: number | null
  isActive: boolean
  images: File[]
}

export type ProductVariantResponse = { success: boolean; message: string; data: RawProductVariant }
export type ProductVariantDeleteResponse = { success: boolean; message: string }

export type VariantWarehouseStockResponse = {
  success: boolean
  message: string
  data: RawVariantWarehouseStock
}

export type VariantWarehouseStockDeleteResponse = { success: boolean; message: string }

export type VariantWarehouseStockFormValues = {
  warehouseId: number | null
  quantity: number | null
}
