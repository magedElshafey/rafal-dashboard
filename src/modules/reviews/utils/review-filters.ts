import type { ReviewRatingFilter, ReviewsFilters, ReviewSortBy, ReviewSortDir } from '../types/review.types'

export const reviewRatingValues: ReviewRatingFilter[] = [1, 2, 3, 4, 5]
export const reviewSortValues: ReviewSortBy[] = ['created_at', 'rating', 'helpful_count']
export const reviewSortDirections: ReviewSortDir[] = ['asc', 'desc']
export const reviewFilterNames = [
  'product_id',
  'user_id',
  'rating',
  'rating_min',
  'rating_max',
  'date_from',
  'date_to',
  'sort_by',
  'sort_dir',
]
export const emptyReviewsFilters: ReviewsFilters = {
  search: '',
  productId: null,
  userId: null,
  rating: null,
  ratingMin: null,
  ratingMax: null,
  dateFrom: '',
  dateTo: '',
  sortBy: null,
  sortDir: null,
}

const ratings = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5 } as const satisfies Record<string, ReviewRatingFilter>
const rating = (value?: string) =>
  value && Object.prototype.hasOwnProperty.call(ratings, value) ? ratings[value as keyof typeof ratings] : null
const id = (value?: string) => {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}
const date = (value: string) => {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function readReviewsFilters(query: Record<string, string> | null): ReviewsFilters {
  const sortBy = query?.sort_by as ReviewSortBy | undefined
  const sortDir = query?.sort_dir as ReviewSortDir | undefined
  return {
    search: query?.search?.trim() ?? '',
    productId: id(query?.product_id),
    userId: id(query?.user_id),
    rating: rating(query?.rating),
    ratingMin: rating(query?.rating_min),
    ratingMax: rating(query?.rating_max),
    dateFrom: query?.date_from ?? '',
    dateTo: query?.date_to ?? '',
    sortBy: sortBy && reviewSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && reviewSortDirections.includes(sortDir) ? sortDir : null,
  }
}
export const validReviewsDateRange = (filters: Pick<ReviewsFilters, 'dateFrom' | 'dateTo'>) =>
  date(filters.dateFrom) &&
  date(filters.dateTo) &&
  (!filters.dateFrom || !filters.dateTo || filters.dateFrom <= filters.dateTo)
export const validReviewsRatingRange = (filters: Pick<ReviewsFilters, 'ratingMin' | 'ratingMax'>) =>
  filters.ratingMin === null || filters.ratingMax === null || filters.ratingMin <= filters.ratingMax
export const validReviewsFilters = (filters: ReviewsFilters) =>
  validReviewsDateRange(filters) && validReviewsRatingRange(filters)
export function serializeReviewsFilters(filters: ReviewsFilters) {
  if (!validReviewsFilters(filters)) throw new Error('Invalid review filter range')
  return {
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.productId ? { product_id: filters.productId } : {}),
    ...(filters.userId ? { user_id: filters.userId } : {}),
    ...(filters.rating ? { rating: filters.rating } : {}),
    ...(filters.ratingMin ? { rating_min: filters.ratingMin } : {}),
    ...(filters.ratingMax ? { rating_max: filters.ratingMax } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
