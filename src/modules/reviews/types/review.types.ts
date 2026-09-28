import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type ReviewModerationTarget = Exclude<ReviewStatus, 'pending'>

export type ReviewReviewer = {
  id: number
  firstName: string
  lastName: string | null
  email: string
}

export type ReviewProduct = {
  id: number
  name: string
  slug: string | null
}

export type ReviewListItem = {
  id: number
  rating: number
  comment: string
  status: ReviewStatus
  adminResponse: string | null
  helpfulCount: number
  reportsCount: number
  reviewer: ReviewReviewer
  product: ReviewProduct
  createdAt: string
  updatedAt: string
}

export type RawReviewUser = {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
}

export type RawReviewProduct = {
  id: number
  name: string | null
  slug: string | null
}

export type RawReview = {
  id: number
  rating: number | string
  comment: string | null
  status: string
  admin_response: string | null
  helpful_count: number | string
  reports_count: number | string
  user: RawReviewUser | null
  product: RawReviewProduct | null
  created_at: string
  updated_at: string
}

export type ReviewsIndexResponse = PaginatedDashboardResponse<RawReview>
export type RawReviewResponse = {
  success: boolean
  message: string
  data: RawReview
}

export type ReviewResponse = {
  success: boolean
  message: string
  data: ReviewListItem
}
