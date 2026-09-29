import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { testimonialsService } from '@/modules/testimonials/api/testimonials.service'
import { testimonialsKeys } from '@/modules/testimonials/queries/testimonials.keys'

export function useTestimonials() {
  return useInfinitePaginatedQuery({
    queryKey: testimonialsKeys.list(),
    queryFn: (page, signal) => testimonialsService.list(page, signal),
    retry: false,
  })
}
