import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
import type { LocalizedName } from '@/types/localized-name.types'

export type CouponType = 'percent' | 'fixed'

export type LocalizedNullableText = {
  ar: string | null
  en: string | null
}

export type Coupon = {
  id: number
  code: string
  name: LocalizedName
  description: LocalizedNullableText
  type: CouponType
  value: number
  maxDiscountAmount: number | null
  minOrderAmount: number | null
  startsAt: string | null
  endsAt: string | null
  isPublic: boolean
  isActive: boolean
  usageLimitTotal: number | null
  usageLimitPerCustomer: number | null
  newCustomersOnly: boolean
  usagesCount: number
  createdAt: string
  updatedAt: string
}

export type CouponFormValues = {
  code: string
  name: LocalizedName
  description: LocalizedName
  type: CouponType
  value: number
  maxDiscountAmount: number | null
  minOrderAmount: number | null
  startsAt: string
  endsAt: string
  isPublic: boolean
  isActive: boolean
  usageLimitTotal: number | null
  usageLimitPerCustomer: number | null
  newCustomersOnly: boolean
}

export type CouponCreatePayload = {
  code: string
  name: LocalizedName
  description: LocalizedNullableText
  type: CouponType
  value: number
  maxDiscountAmount: number | null
  minOrderAmount: number | null
  startsAt: string | null
  endsAt: string | null
  isPublic: boolean
  isActive: boolean
  usageLimitTotal: number | null
  usageLimitPerCustomer: number | null
  newCustomersOnly: boolean
}

export type CouponUpdatePayload = CouponCreatePayload

export type RawCoupon = {
  id: number
  code: string
  name: LocalizedName
  description: LocalizedNullableText
  type: CouponType
  value: number | string
  max_discount_amount: number | string | null
  min_order_amount: number | string | null
  starts_at: string | null
  ends_at: string | null
  is_public: boolean | 0 | 1
  is_active: boolean | 0 | 1
  usage_limit_total: number | string | null
  usage_limit_per_customer: number | string | null
  new_customers_only: boolean | 0 | 1
  usages_count: number | string
  created_at: string
  updated_at: string
}

export type CouponsIndexResponse = PaginatedDashboardResponse<RawCoupon>
export type RawCouponResponse = { success: boolean; message: string; data: RawCoupon }
export type CouponResponse = { success: boolean; message: string; data: Coupon }
export type DeleteCouponResponse = Omit<RawCouponResponse, 'data'>
