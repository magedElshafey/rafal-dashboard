import type { TestimonialsFilters } from '@/modules/testimonials/types/testimonial.types'
import { emptyTestimonialsFilters } from '@/modules/testimonials/utils/testimonial-filters'

export const testimonialsKeys = {
  all: ['testimonials'] as const,
  lists: () => [...testimonialsKeys.all, 'list'] as const,
  list: (filters: TestimonialsFilters = emptyTestimonialsFilters) => [...testimonialsKeys.lists(), filters] as const,
}
