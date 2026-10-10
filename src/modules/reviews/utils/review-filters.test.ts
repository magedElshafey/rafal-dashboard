import { describe, expect, it } from 'vitest'
import { reviewsKeys } from '../queries/reviews.keys'
import {
  emptyReviewsFilters,
  readReviewsFilters,
  reviewRatingValues,
  reviewSortDirections,
  reviewSortValues,
  serializeReviewsFilters,
  validReviewsDateRange,
  validReviewsRatingRange,
} from './review-filters'

describe('Reviews server query filters', () => {
  it('trims search and omits blank search and per_page', () => {
    expect(readReviewsFilters({ search: '  roses  ' }).search).toBe('roses')
    expect(serializeReviewsFilters({ ...emptyReviewsFilters, search: '   ' })).toEqual({})
    expect(serializeReviewsFilters(readReviewsFilters({ per_page: '50' }))).not.toHaveProperty('per_page')
  })
  it.each([
    ['product_id', '7', 7],
    ['user_id', '9', 9],
  ] as const)('accepts positive %s', (name, value, expected) =>
    expect(readReviewsFilters({ [name]: value })[name === 'product_id' ? 'productId' : 'userId']).toBe(expected)
  )
  it.each(['0', '-1', '1.5', 'abc', ''])('ignores invalid IDs=%j', (value) => {
    expect(readReviewsFilters({ product_id: value, user_id: value })).toMatchObject({ productId: null, userId: null })
  })
  it.each(reviewRatingValues)('accepts exact rating values=%s', (value) => {
    expect(
      readReviewsFilters({ rating: String(value), rating_min: String(value), rating_max: String(value) })
    ).toMatchObject({ rating: value, ratingMin: value, ratingMax: value })
  })
  it.each(['0', '6', '-1', '4.5', '1.0', '01', 'abc'])('ignores invalid rating=%j', (value) =>
    expect(readReviewsFilters({ rating: value }).rating).toBeNull()
  )
  it('validates rating range independently', () => {
    expect(validReviewsRatingRange({ ratingMin: 2, ratingMax: 5 })).toBe(true)
    expect(validReviewsRatingRange({ ratingMin: 5, ratingMax: 2 })).toBe(false)
  })
  it('serializes dates and validates strict date ranges independently', () => {
    expect(serializeReviewsFilters({ ...emptyReviewsFilters, dateFrom: '2026-10-01', dateTo: '2026-10-09' })).toEqual({
      date_from: '2026-10-01',
      date_to: '2026-10-09',
    })
    expect(validReviewsDateRange({ dateFrom: 'bad', dateTo: '' })).toBe(false)
    expect(validReviewsDateRange({ dateFrom: '2026-10-10', dateTo: '2026-10-09' })).toBe(false)
  })
  it.each(reviewSortValues)('serializes sort_by=%s', (sortBy) =>
    expect(serializeReviewsFilters({ ...emptyReviewsFilters, sortBy })).toEqual({ sort_by: sortBy })
  )
  it.each(reviewSortDirections)('serializes sort_dir=%s', (sortDir) =>
    expect(serializeReviewsFilters({ ...emptyReviewsFilters, sortDir })).toEqual({ sort_dir: sortDir })
  )
  it('ignores unsupported sorting', () =>
    expect(readReviewsFilters({ sort_by: 'id', sort_dir: 'down' })).toEqual(emptyReviewsFilters))
  it('includes all filters in query identity', () => {
    const filtered = { ...emptyReviewsFilters, search: 'rose', productId: 7, userId: 9, rating: 5 as const }
    expect(reviewsKeys.list(filtered)).not.toEqual(reviewsKeys.list())
  })
})
