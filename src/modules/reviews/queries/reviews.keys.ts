export const reviewsKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewsKeys.all, 'list'] as const,
  list: (filters: ReviewsFilters = emptyReviewsFilters) => [...reviewsKeys.lists(), filters] as const,
}
import type { ReviewsFilters } from '../types/review.types'
import { emptyReviewsFilters } from '../utils/review-filters'
