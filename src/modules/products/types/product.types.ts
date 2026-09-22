import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
import type { LocalizedName } from '@/types/localized-name.types'

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
