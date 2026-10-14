import type { ImageUploadValue } from '@/components/form/image-upload'
import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type LocalizedTitle = { ar: string; en: string }
export const bannerPositions = ['hero', 'men', 'gifts', 'loyalty'] as const
export type BannerPosition = (typeof bannerPositions)[number]
export type BannerDestinationType = 'product' | 'category'
export type BannerPlacement = 'home' | 'splash'
export type BannerPlatform = 'web' | 'mobile' | 'both'
export type BannerSortBy = 'sort_order' | 'created_at' | 'starts_at'
export type BannerSortDir = 'asc' | 'desc'

export type BannersFilters = {
  platform: BannerPlatform | null
  isActive: boolean | null
  activeNow: boolean | null
  sortBy: BannerSortBy | null
  sortDir: BannerSortDir | null
}

export type Banner = {
  id: number
  placement: BannerPlacement
  title: LocalizedTitle
  link_url: string | null
  position: BannerPosition | null
  product_id: number | null
  category_id: number | null
  platform: BannerPlatform
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  sort_order: number
  image_url: string
  created_at: string
  updated_at: string
}

export type BannerPayload = {
  title: LocalizedTitle
  position: BannerPosition
  product_id: number | null
  category_id: number | null
  platform: BannerPlatform
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  sort_order: number
  image?: File
}

export type BannerFormValues = Omit<BannerPayload, 'position' | 'starts_at' | 'ends_at' | 'image'> & {
  destination_type: BannerDestinationType | ''
  position: BannerPosition | ''
  starts_at: string
  ends_at: string
  image: ImageUploadValue
}

export type BannersIndexResponse = PaginatedDashboardResponse<Banner>
export type BannerResponse = { success: boolean; message: string; data: Banner }
export type DeleteBannerResponse = Omit<BannerResponse, 'data'>
