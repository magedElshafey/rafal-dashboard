import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { testimonialsService } from '@/modules/testimonials/api/testimonials.service'
import { testimonialsKeys } from '@/modules/testimonials/queries/testimonials.keys'
import type { TestimonialsFilters } from '@/modules/testimonials/types/testimonial.types'
import {
  emptyTestimonialsFilters,
  validTestimonialsCreatedRange,
} from '@/modules/testimonials/utils/testimonial-filters'

export function useTestimonials(filters: TestimonialsFilters = emptyTestimonialsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: testimonialsKeys.list(filters),
    queryFn: (page, signal) => testimonialsService.list(page, signal, filters),
    enabled: validTestimonialsCreatedRange(filters),
    retry: false,
  })
}
