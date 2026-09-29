import type { ImageUploadValue } from '@/components/form/image-upload'
import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
import type { LocalizedName } from '@/types/localized-name.types'

export type Testimonial = {
  id: number
  name: LocalizedName
  title: LocalizedName
  comment: LocalizedName
  rating: number
  sortOrder: number
  isPublished: boolean
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

export type TestimonialFormValues = {
  name: LocalizedName
  title: LocalizedName
  comment: LocalizedName
  rating: number | null
  sortOrder: number | null
  isPublished: boolean
  avatar: ImageUploadValue
}

export type TestimonialWritePayload = {
  name: LocalizedName
  title: LocalizedName
  comment: LocalizedName
  rating: number
  sortOrder: number
  isPublished: boolean
  avatar?: File
}

export type RawTestimonial = {
  id: number
  name: LocalizedName
  title: LocalizedName
  comment: LocalizedName
  rating: number | string
  sort_order: number | string
  is_published: boolean | 0 | 1
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type TestimonialsIndexResponse = PaginatedDashboardResponse<RawTestimonial>
export type RawTestimonialResponse = { success: boolean; message: string; data: RawTestimonial }
export type TestimonialResponse = { success: boolean; message: string; data: Testimonial }
export type UpdateTestimonialResponse = { success: boolean; message: string; data?: RawTestimonial }
export type DeleteTestimonialResponse = { success: boolean; message: string }
