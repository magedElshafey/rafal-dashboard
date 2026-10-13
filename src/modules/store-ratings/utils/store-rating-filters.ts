import {
  readReviewsFilters,
  serializeReviewsFilters,
  validReviewsDateRange,
  validReviewsRatingRange,
} from '@/modules/reviews/utils/review-filters'
import type { StoreRatingsFilters } from '../types/store-rating.types'

export const storeRatingFilterNames = [
  'user_id',
  'rating',
  'rating_min',
  'rating_max',
  'date_from',
  'date_to',
  'sort_by',
  'sort_dir',
]
export const storeRatingSortValues = ['created_at', 'rating'] as const

export function readStoreRatingsFilters(query: Record<string, string> | null): StoreRatingsFilters {
  const filters = readReviewsFilters(query)
  return {
    userId: filters.userId,
    rating: filters.rating,
    ratingMin: filters.ratingMin,
    ratingMax: filters.ratingMax,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sortBy: filters.sortBy === 'created_at' || filters.sortBy === 'rating' ? filters.sortBy : null,
    sortDir: filters.sortDir,
  }
}

export const emptyStoreRatingsFilters = readStoreRatingsFilters(null)
export const validStoreRatingsFilters = (filters: StoreRatingsFilters) =>
  validReviewsDateRange(filters) && validReviewsRatingRange(filters)

export function serializeStoreRatingsFilters(filters: StoreRatingsFilters) {
  return serializeReviewsFilters({ ...filters, search: '', productId: null })
}
