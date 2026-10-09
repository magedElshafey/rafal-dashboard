import { describe, expect, it } from 'vitest'
import { couponsKeys } from '../queries/coupons.keys'
import {
  couponSortDirections,
  couponSortValues,
  emptyCouponsFilters,
  readCouponsFilters,
  serializeCouponsFilters,
  validCouponsDateRange,
} from './coupon-filters'

describe('Coupons server query filters', () => {
  it.each(['percent', 'fixed'] as const)('serializes type=%s', (type) => {
    expect(serializeCouponsFilters({ ...emptyCouponsFilters, type })).toEqual({ type })
  })

  it('ignores unsupported type and omits inactive filters', () => {
    expect(readCouponsFilters({ type: 'free', search: 'ignored', per_page: '50' })).toEqual(emptyCouponsFilters)
    expect(serializeCouponsFilters(emptyCouponsFilters)).toEqual({})
  })

  it.each([
    [true, 1],
    [false, 0],
  ] as const)('preserves is_currently_valid=%s', (isCurrentlyValid, serialized) => {
    expect(serializeCouponsFilters({ ...emptyCouponsFilters, isCurrentlyValid })).toEqual({
      is_currently_valid: serialized,
    })
  })

  it('serializes valid dates and rejects an invalid range', () => {
    expect(
      serializeCouponsFilters({
        ...emptyCouponsFilters,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-09',
      })
    ).toEqual({ date_from: '2026-10-01', date_to: '2026-10-09' })
    const invalid = { ...emptyCouponsFilters, dateFrom: '2026-10-10', dateTo: '2026-10-09' }
    expect(validCouponsDateRange(invalid)).toBe(false)
    expect(() => serializeCouponsFilters(invalid)).toThrow('Invalid coupon date range')
  })

  it.each(couponSortValues)('serializes supported sort_by=%s', (sortBy) => {
    expect(serializeCouponsFilters({ ...emptyCouponsFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(couponSortDirections)('serializes supported sort_dir=%s', (sortDir) => {
    expect(serializeCouponsFilters({ ...emptyCouponsFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('ignores unsupported sorting and includes active filters in query identity', () => {
    expect(readCouponsFilters({ sort_by: 'value', sort_dir: 'down' })).toEqual(emptyCouponsFilters)
    expect(couponsKeys.list({ ...emptyCouponsFilters, type: 'fixed' })).not.toEqual(couponsKeys.list())
  })
})
