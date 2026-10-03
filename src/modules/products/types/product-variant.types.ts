import type { ImageUploadValue } from '@/components/form/image-upload'
import type { ProductMedia, RawProductMedia } from '@/modules/products/types/product-media.types'

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type VariantAttributes = Record<string, string>

export type RawVariantWarehouseStock = {
  id?: number | string
  warehouse_id: number | string
  quantity: number | string
}

export type VariantWarehouseStock = {
  id?: number | null
  warehouseId: number
  quantity: number
}

export type RawDashboardProductVariant = {
  id: number | string
  sku: string
  attributes: unknown
  price_override: number | string | null
  is_active: boolean | 0 | 1 | '0' | '1'
  is_default?: boolean | 0 | 1 | '0' | '1'
  images: RawProductMedia[]
  warehouse_stocks: RawVariantWarehouseStock[]
}

export type ProductVariant = {
  id: number
  sku: string
  attributes: VariantAttributes
  priceOverride: number | null
  isActive: boolean
  isDefault?: boolean
  images: ProductMedia[]
  warehouseStocks: VariantWarehouseStock[]
}

export type VariantAttributeRow = {
  key: string
  value: string
  isPersisted?: boolean
  originalValue?: string
}

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

export type ProductVariantUpdatePayload = Partial<Omit<ProductVariantCreatePayload, 'images'>> & {
  images?: File[]
}

export type VariantOptionPresentation = 'color_swatch' | 'text_swatch' | 'dropdown' | 'image_swatch'
export type VariantOptionValue = {
  code: string
  label: { ar: string; en: string }
  visual?: { type: 'color' | 'image'; value: string }
}
export type ProductVariantAttributeDefinition = {
  key: string
  label: { ar: string; en: string }
  presentation: VariantOptionPresentation
  values: VariantOptionValue[]
}

export type ProductVariantResponse = { success: boolean; message: string; data: RawDashboardProductVariant }
export type ProductVariantDeleteResponse = { success: boolean; message: string }

export type VariantWarehouseStockResponse = {
  success: boolean
  message: string
  data?: RawVariantWarehouseStock
}

export type VariantWarehouseStockDeleteResponse = { success: boolean; message: string }

export type VariantWarehouseStockFormValues = {
  warehouseId: number | null
  quantity: number | null
}
