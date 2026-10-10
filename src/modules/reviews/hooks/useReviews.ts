import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { reviewsService } from '@/modules/reviews/api/reviews.service'
import { reviewsKeys } from '@/modules/reviews/queries/reviews.keys'
import type { ReviewsFilters } from '@/modules/reviews/types/review.types'
import { emptyReviewsFilters, validReviewsFilters } from '@/modules/reviews/utils/review-filters'

export function useReviews(filters: ReviewsFilters = emptyReviewsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: reviewsKeys.list(filters),
    queryFn: (page, signal) => reviewsService.list(page, signal, filters),
    enabled: validReviewsFilters(filters),
    retry: false,
  })
}
