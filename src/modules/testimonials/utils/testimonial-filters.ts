import type {
  TestimonialsFilters,
  TestimonialRatingFilter,
  TestimonialSortBy,
  TestimonialSortDir,
} from '@/modules/testimonials/types/testimonial.types'

export const testimonialRatingValues: TestimonialRatingFilter[] = [1, 2, 3, 4, 5]
const testimonialRatingByQueryValue = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
} as const satisfies Record<string, TestimonialRatingFilter>
export const testimonialSortValues: TestimonialSortBy[] = ['sort_order', 'id', 'created_at', 'rating', 'is_published']
export const testimonialSortDirections: TestimonialSortDir[] = ['asc', 'desc']
export const testimonialFilterNames = ['rating', 'created_from', 'created_to', 'sort_by', 'sort_dir']

export const emptyTestimonialsFilters: TestimonialsFilters = {
  rating: null,
  createdFrom: '',
  createdTo: '',
  sortBy: null,
  sortDir: null,
}

const validDate = (value: string) => {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function readTestimonialsFilters(query: Record<string, string> | null): TestimonialsFilters {
  const rawRating = query?.rating
  const rating =
    rawRating && Object.prototype.hasOwnProperty.call(testimonialRatingByQueryValue, rawRating)
      ? testimonialRatingByQueryValue[rawRating as keyof typeof testimonialRatingByQueryValue]
      : null
  const sortBy = query?.sort_by as TestimonialSortBy | undefined
  const sortDir = query?.sort_dir as TestimonialSortDir | undefined

  return {
    rating,
    createdFrom: query?.created_from ?? '',
    createdTo: query?.created_to ?? '',
    sortBy: sortBy && testimonialSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && testimonialSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function validTestimonialsCreatedRange(filters: Pick<TestimonialsFilters, 'createdFrom' | 'createdTo'>) {
  return (
    validDate(filters.createdFrom) &&
    validDate(filters.createdTo) &&
    (!filters.createdFrom || !filters.createdTo || filters.createdFrom <= filters.createdTo)
  )
}

export function serializeTestimonialsFilters(filters: TestimonialsFilters) {
  if (!validTestimonialsCreatedRange(filters)) throw new Error('Invalid testimonial created date range')

  return {
    ...(filters.rating ? { rating: filters.rating } : {}),
    ...(filters.createdFrom ? { created_from: filters.createdFrom } : {}),
    ...(filters.createdTo ? { created_to: filters.createdTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
