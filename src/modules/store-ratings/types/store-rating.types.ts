import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'
import type { RawReviewUser, ReviewReviewer, ReviewStatus, ReviewsFilters } from '@/modules/reviews/types/review.types'

export type RawStoreRating = {
  id: number
  rating: number | string
  comment: string | null
  status: string
  admin_response: string | null
  user: RawReviewUser
  order: { id: number; order_number: string }
  created_at: string
  updated_at: string
}

export type StoreRating = {
  id: number
  rating: number
  comment: string | null
  status: ReviewStatus
  adminResponse: string | null
  user: ReviewReviewer
  order: { id: number; orderNumber: string }
  createdAt: string
  updatedAt: string
}

export type StoreRatingsIndexResponse = PaginatedDashboardResponse<RawStoreRating>
export type StoreRatingsFilters = Omit<ReviewsFilters, 'search' | 'productId' | 'sortBy'> & {
  sortBy: 'created_at' | 'rating' | null
}
