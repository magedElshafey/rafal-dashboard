import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
import type { LocalizedName } from '@/types/localized-name.types'

export type ShippingMethod = {
  id: number
  code: string
  name: LocalizedName
  etaLabel: LocalizedName
  price: number
  isPickup: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type ShippingMethodFormValues = {
  code: string
  name: LocalizedName
  etaLabel: LocalizedName
  price: number
  isPickup: boolean
  isActive: boolean
  sortOrder: number | null
}

export type ShippingMethodCreatePayload = ShippingMethodFormValues

export type ShippingMethodUpdatePayload = {
  code?: string
  nameAr?: string
  nameEn?: string
  etaLabelAr?: string
  etaLabelEn?: string
  price?: number
  isPickup?: boolean
  isActive?: boolean
  sortOrder?: number
}

export type RawShippingMethod = {
  id: number
  code: string
  name: LocalizedName
  eta_label: LocalizedName
  price: string
  is_pickup: boolean
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type ShippingMethodsIndexResponse = PaginatedDashboardResponse<RawShippingMethod>
export type RawShippingMethodResponse = { success: boolean; message: string; data: RawShippingMethod }
export type ShippingMethodResponse = { success: boolean; message: string; data: ShippingMethod }
export type DeleteShippingMethodResponse = Omit<RawShippingMethodResponse, 'data'>
