import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { reviewsService } from '@/modules/reviews/api/reviews.service'
import { reviewsKeys } from '@/modules/reviews/queries/reviews.keys'

export function useReviews() {
  return useInfinitePaginatedQuery({
    queryKey: reviewsKeys.list(),
    queryFn: (page, signal) => reviewsService.list(page, signal),
    retry: false,
  })
}
