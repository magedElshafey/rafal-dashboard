import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
import type { LocalizedName } from '@/types/localized-name.types'
import type { ImageUploadValue } from '@/components/form/image-upload'

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
  primaryImageUrl: string | null
  createdAt: string
  updatedAt: string
}

export type RawProductListItem = {
  id: number
  category_id: number | null
  sku: string
  name: LocalizedName
  slug: string
  base_price: string
  discount_percentage: string | number | null
  discount_end_at: string | null
  is_personalizable: boolean
  is_new_arrival: boolean
  is_active: boolean
  sort_order: number
  simulated_viewers_count: number
  simulated_orders_count: number
  variants: unknown[]
  images: string[]
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
