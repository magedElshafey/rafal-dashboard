import type { ImageUploadValue } from '@/components/form/image-upload'
import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type LocalizedTitle = { ar: string; en: string }
export type BannerPlacement = 'home' | 'splash'
export type BannerPlatform = 'web' | 'mobile' | 'both'

export type Banner = {
  id: number
  placement: BannerPlacement
  title: LocalizedTitle
  link_url: string | null
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
  placement: BannerPlacement
  title: LocalizedTitle
  link_url: string | null
  platform: BannerPlatform
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  sort_order: number
  image?: File
}

export type BannerFormValues = Omit<BannerPayload, 'link_url' | 'starts_at' | 'ends_at' | 'image'> & {
  link_url: string
  starts_at: string
  ends_at: string
  image: ImageUploadValue
}

export type BannersIndexResponse = PaginatedDashboardResponse<Banner>
export type BannerResponse = { success: boolean; message: string; data: Banner }
export type DeleteBannerResponse = Omit<BannerResponse, 'data'>
