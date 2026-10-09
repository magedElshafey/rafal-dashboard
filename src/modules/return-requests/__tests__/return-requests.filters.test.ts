import { describe, expect, it } from 'vitest'
import { returnRequestsKeys } from '../queries/return-requests.keys'
import {
  emptyReturnRequestsFilters,
  readReturnRequestsFilters,
  returnRequestSortDirections,
  returnRequestSortValues,
  serializeReturnRequestsFilters,
  validReturnRequestsDateRange,
} from '../utils/return-request-filters'

describe('Return Requests server query serialization', () => {
  it('serializes a positive order_id and omits an empty or invalid order_id', () => {
    expect(serializeReturnRequestsFilters(emptyReturnRequestsFilters)).toEqual({})
    expect(serializeReturnRequestsFilters({ ...emptyReturnRequestsFilters, orderId: 47 })).toEqual({ order_id: 47 })
    expect(readReturnRequestsFilters({ order_id: '' }).orderId).toBeNull()
    expect(readReturnRequestsFilters({ order_id: '0' }).orderId).toBeNull()
    expect(readReturnRequestsFilters({ order_id: 'invalid' }).orderId).toBeNull()
    expect(serializeReturnRequestsFilters({ ...emptyReturnRequestsFilters, orderId: -1 })).toEqual({})
  })

  it('serializes date_from and date_to', () => {
    expect(
      serializeReturnRequestsFilters({
        ...emptyReturnRequestsFilters,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-09',
      })
    ).toEqual({ date_from: '2026-10-01', date_to: '2026-10-09' })
  })

  it('rejects invalid date ranges', () => {
    const filters = { ...emptyReturnRequestsFilters, dateFrom: '2026-10-10', dateTo: '2026-10-09' }
    expect(validReturnRequestsDateRange(filters)).toBe(false)
    expect(() => serializeReturnRequestsFilters(filters)).toThrow('Invalid return request date range')
  })

  it.each(returnRequestSortValues)('serializes supported sort_by %s', (sortBy) => {
    expect(serializeReturnRequestsFilters({ ...emptyReturnRequestsFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(returnRequestSortDirections)('serializes supported sort_dir %s', (sortDir) => {
    expect(serializeReturnRequestsFilters({ ...emptyReturnRequestsFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('drops unsupported URL values', () => {
    expect(readReturnRequestsFilters({ sort_by: 'id', sort_dir: 'down', search: 'ignored' })).toEqual(
      emptyReturnRequestsFilters
    )
  })

  it('includes every active filter in query identity', () => {
    const variants = [
      { orderId: 47 },
      { dateFrom: '2026-10-01' },
      { dateTo: '2026-10-09' },
      { sortBy: 'status' as const },
      { sortDir: 'desc' as const },
    ]
    const keys = [
      returnRequestsKeys.list(),
      ...variants.map((variant) => returnRequestsKeys.list({ ...emptyReturnRequestsFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
