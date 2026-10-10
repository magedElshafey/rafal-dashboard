import { describe, expect, it } from 'vitest'
import { testimonialsKeys } from '@/modules/testimonials/queries/testimonials.keys'
import {
  emptyTestimonialsFilters,
  readTestimonialsFilters,
  serializeTestimonialsFilters,
  testimonialRatingValues,
  testimonialSortDirections,
  testimonialSortValues,
  validTestimonialsCreatedRange,
} from './testimonial-filters'

describe('Testimonials server query filters', () => {
  it.each(testimonialRatingValues)('accepts and serializes rating=%s', (rating) => {
    expect(readTestimonialsFilters({ rating: String(rating) }).rating).toBe(rating)
    expect(serializeTestimonialsFilters({ ...emptyTestimonialsFilters, rating })).toEqual({ rating })
  })

  it.each(['1.0', '01', ' 1 ', '4.5', '0', '6', 'abc'])('ignores non-canonical rating=%j', (rating) => {
    expect(readTestimonialsFilters({ rating }).rating).toBeNull()
  })

  it('serializes dates and omits inactive values, search, and per_page', () => {
    expect(
      serializeTestimonialsFilters({ ...emptyTestimonialsFilters, createdFrom: '2026-10-01', createdTo: '2026-10-09' })
    ).toEqual({ created_from: '2026-10-01', created_to: '2026-10-09' })
    expect(serializeTestimonialsFilters(emptyTestimonialsFilters)).toEqual({})
    expect(readTestimonialsFilters({ search: 'x', per_page: '50' })).toEqual(emptyTestimonialsFilters)
  })

  it.each(['bad-date', '2026-02-30'])('rejects malformed date=%s', (createdFrom) => {
    const filters = { ...emptyTestimonialsFilters, createdFrom }
    expect(validTestimonialsCreatedRange(filters)).toBe(false)
    expect(() => serializeTestimonialsFilters(filters)).toThrow('Invalid testimonial created date range')
  })

  it('rejects created_from after created_to', () => {
    expect(validTestimonialsCreatedRange({ createdFrom: '2026-10-10', createdTo: '2026-10-09' })).toBe(false)
  })

  it.each(testimonialSortValues)('serializes supported sort_by=%s', (sortBy) => {
    expect(serializeTestimonialsFilters({ ...emptyTestimonialsFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(testimonialSortDirections)('serializes supported sort_dir=%s', (sortDir) => {
    expect(serializeTestimonialsFilters({ ...emptyTestimonialsFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('ignores unsupported sort values', () => {
    expect(readTestimonialsFilters({ sort_by: 'name', sort_dir: 'down' })).toEqual(emptyTestimonialsFilters)
  })

  it('includes every active filter in query identity', () => {
    const variants = [
      { rating: 1 as const },
      { createdFrom: '2026-10-01' },
      { createdTo: '2026-10-09' },
      { sortBy: 'rating' as const },
      { sortDir: 'desc' as const },
    ]
    const keys = [
      testimonialsKeys.list(),
      ...variants.map((variant) => testimonialsKeys.list({ ...emptyTestimonialsFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
