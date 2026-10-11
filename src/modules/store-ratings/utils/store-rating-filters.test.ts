import { describe, expect, it } from 'vitest'
import {
  reviewRatingValues,
  validReviewsDateRange,
  validReviewsRatingRange,
} from '@/modules/reviews/utils/review-filters'
import { storeRatingsKeys } from '../queries/store-ratings.keys'
import {
  emptyStoreRatingsFilters,
  readStoreRatingsFilters,
  serializeStoreRatingsFilters,
  storeRatingFilterNames,
  validStoreRatingsFilters,
} from './store-rating-filters'

describe('Store Ratings URL filters', () => {
  it.each(reviewRatingValues)('accepts canonical rating %s for exact and both bounds', (rating) => {
    expect(
      readStoreRatingsFilters({ rating: String(rating), rating_min: String(rating), rating_max: String(rating) })
    ).toMatchObject({ rating, ratingMin: rating, ratingMax: rating })
  })
  it.each(['01', '1.0', ' 1 ', '0', '6', '4.5', 'abc', '-1', ''])(
    'rejects rating alias %j for all rating fields',
    (value) => {
      expect(readStoreRatingsFilters({ rating: value, rating_min: value, rating_max: value })).toEqual(
        emptyStoreRatingsFilters
      )
    }
  )
  it.each(['0', '-1', '1.5', 'abc', ' 1 ', '9007199254740992'])('rejects invalid user ID %j', (user_id) =>
    expect(readStoreRatingsFilters({ user_id }).userId).toBeNull()
  )
  it('has precisely the supported filters and forwards exact rating with its range', () => {
    expect(storeRatingFilterNames).toEqual([
      'user_id',
      'rating',
      'rating_min',
      'rating_max',
      'date_from',
      'date_to',
      'sort_by',
      'sort_dir',
    ])
    expect(
      serializeStoreRatingsFilters(
        readStoreRatingsFilters({
          user_id: '7',
          rating: '3',
          rating_min: '4',
          rating_max: '5',
          status: 'pending',
          search: 'x',
          per_page: '50',
          order_id: '47',
          comment: 'x',
          admin_response: 'x',
          product_id: '3',
        })
      )
    ).toEqual({ user_id: 7, rating: 3, rating_min: 4, rating_max: 5 })
  })
  it.each(['created_at', 'rating'])('accepts sort_by %s', (sort_by) =>
    expect(serializeStoreRatingsFilters(readStoreRatingsFilters({ sort_by }))).toEqual({ sort_by })
  )
  it.each(['asc', 'desc'])('accepts sort_dir %s', (sort_dir) =>
    expect(serializeStoreRatingsFilters(readStoreRatingsFilters({ sort_dir }))).toEqual({ sort_dir })
  )
  it('excludes unsupported sorting', () =>
    expect(readStoreRatingsFilters({ sort_by: 'helpful_count', sort_dir: 'up' })).toEqual(emptyStoreRatingsFilters))
  it.each(['bad', '2026-02-30', '2026-2-01', '2026-01-01T00:00:00Z'])('rejects malformed dates %j', (date_from) =>
    expect(validStoreRatingsFilters(readStoreRatingsFilters({ date_from }))).toBe(false)
  )
  it('validates date/rating ranges independently and accepts open-ended ranges', () => {
    const ratingInvalid = readStoreRatingsFilters({
      rating_min: '5',
      rating_max: '2',
      date_from: '2026-01-01',
      date_to: '2026-02-01',
    })
    expect(validReviewsDateRange(ratingInvalid)).toBe(true)
    expect(validReviewsRatingRange(ratingInvalid)).toBe(false)
    const dateInvalid = readStoreRatingsFilters({
      rating_min: '2',
      rating_max: '5',
      date_from: '2026-02-01',
      date_to: '2026-01-01',
    })
    expect(validReviewsDateRange(dateInvalid)).toBe(false)
    expect(validReviewsRatingRange(dateInvalid)).toBe(true)
    expect(validStoreRatingsFilters(readStoreRatingsFilters({ rating_min: '5', date_from: '2026-01-01' }))).toBe(true)
    expect(validStoreRatingsFilters(readStoreRatingsFilters({ rating_max: '1', date_to: '2026-01-01' }))).toBe(true)
  })
  it.each(storeRatingFilterNames)('includes %s in query identity', (key) => {
    const values: Record<string, string> = {
      user_id: '1',
      rating: '3',
      rating_min: '1',
      rating_max: '5',
      date_from: '2026-01-01',
      date_to: '2026-02-01',
      sort_by: 'rating',
      sort_dir: 'desc',
    }
    expect(storeRatingsKeys.list(readStoreRatingsFilters({ [key]: values[key] }))).not.toEqual(storeRatingsKeys.list())
  })
})
