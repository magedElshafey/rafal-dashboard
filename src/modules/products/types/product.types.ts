import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
import type { LocalizedName } from '@/types/localized-name.types'
import type { ImageUploadValue } from '@/components/form/image-upload'
import type {
  JsonValue,
  ProductVariant,
  RawDashboardProductVariant,
} from '@/modules/products/types/product-variant.types'
import type { ProductMedia, RawProductMedia } from '@/modules/products/types/product-media.types'

export type ProductListItem = {
  id: number
  categoryId: number | null
  sku: string
  name: LocalizedName
  slug: string
  basePrice: number
  discountPercentage: number | null
  discountEndAt: string | null
  isPersonalizable: boolean
  isNewArrival: boolean
  isActive: boolean
  sortOrder: number
  simulatedViewersCount: number
  simulatedOrdersCount: number
  variantCount: number
  images: ProductMedia[]
  createdAt: string
  updatedAt: string
}

export type RawProductListItem = {
  id: number | string
  category_id: number | string | null
  sku: string
  name: LocalizedName
  slug: string
  base_price: string
  discount_percentage: string | number | null
  discount_end_at: string | null
  is_personalizable: boolean | 0 | 1 | '0' | '1'
  is_new_arrival: boolean | 0 | 1 | '0' | '1'
  is_active: boolean | 0 | 1 | '0' | '1'
  sort_order: number | string
  simulated_viewers_count: number | string
  simulated_orders_count: number | string
  variants: unknown[]
  images: Array<RawProductMedia | string>
  created_at: string
  updated_at: string
}

export type ProductsIndexResponse = PaginatedDashboardResponse<RawProductListItem>

export type ProductCreateFormValues = {
  categoryId: number | null
  sku: string
  name: LocalizedName
  description: LocalizedName
  basePrice: number | null
  discountPercentage: number | null
  discountEndAt: string
  isPersonalizable: boolean
  personalizationMaxLength: number | null
  personalizationFee: number | null
  hidePriceOnPackaging: boolean
  isNewArrival: boolean
  isActive: boolean
  sortOrder: number | null
  images: ImageUploadValue
}

export type ProductFormValues = ProductCreateFormValues

export type RawProductDetail = {
  id: number | string
  category_id: number | string | null
  sku: string
  name: { ar?: string | null; en?: string | null }
  description: { ar?: string | null; en?: string | null } | [] | null
  slug: string
  base_price: number | string
  base_price_incl_vat?: number | string
  discount_percentage: number | string | null
  discount_end_at: string | null
  is_personalizable: boolean | 0 | 1 | '0' | '1'
  personalization_max_length: number | string | null
  personalization_fee: number | string | null
  personalization_languages?: JsonValue
  hide_price_on_packaging: boolean | 0 | 1 | '0' | '1'
  is_new_arrival: boolean | 0 | 1 | '0' | '1'
  is_active: boolean | 0 | 1 | '0' | '1'
  sort_order: number | string
  simulated_viewers_count: number | string
  simulated_orders_count: number | string
  category?: { id: number | string; name: LocalizedName; slug?: string } | null
  variants: RawDashboardProductVariant[]
  images: RawProductMedia[]
  created_at: string
  updated_at: string
}

export type ProductDetail = {
  id: number
  categoryId: number | null
  sku: string
  name: LocalizedName
  description: LocalizedName
  slug: string
  basePrice: number
  basePriceInclVat?: number | null
  discountPercentage: number | null
  discountEndAt: string | null
  isPersonalizable: boolean
  personalizationMaxLength: number | null
  personalizationFee: number | null
  personalizationLanguages?: JsonValue | null
  hidePriceOnPackaging: boolean
  isNewArrival: boolean
  isActive: boolean
  sortOrder: number
  simulatedViewersCount: number
  simulatedOrdersCount: number
  category?: { id: number; name: LocalizedName; slug?: string } | null
  variants: ProductVariant[]
  images: ProductMedia[]
  createdAt: string
  updatedAt: string
}

export type RawProductDetailResponse = { success: boolean; message: string; data: RawProductDetail }
export type ProductDeleteResponse = { success: boolean; message: string }

export type ProductUpdatePayload = Partial<{
  categoryId: number
  sku: string
  name: { ar?: string | null; en?: string | null }
  description: { ar?: string | null; en?: string | null }
  basePrice: number
  discountPercentage: number | null
  discountEndAt: string | null
  isPersonalizable: boolean
  personalizationMaxLength: number | null
  personalizationFee: number | null
  hidePriceOnPackaging: boolean
  isNewArrival: boolean
  isActive: boolean
  sortOrder: number
  images: File[]
}>

export type ProductCreatePayload = {
  categoryId: number
  sku: string
  name: LocalizedName
  description: LocalizedName
  basePrice: number
  discountPercentage: number | null
  discountEndAt: string | null
  isPersonalizable: boolean
  personalizationMaxLength: number | null
  personalizationFee: number | null
  hidePriceOnPackaging: boolean
  isNewArrival: boolean
  isActive: boolean
  sortOrder: number
  images: File[]
}

export type ProductCreateResult = { id: number }

export type ProductCreateResponse = {
  success: boolean
  message: string
  data: ProductCreateResult
}
