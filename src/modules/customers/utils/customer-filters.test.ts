import { describe, expect, it } from 'vitest'
import { customersKeys } from '../queries/customers.keys'
import {
  customerSortDirections,
  customerSortValues,
  emptyCustomersFilters,
  readCustomersFilters,
  serializeCustomersFilters,
  validCustomersDateRange,
} from './customer-filters'

describe('Customers server query serialization', () => {
  it('serializes date_from/date_to and omits empty dates', () => {
    expect(serializeCustomersFilters(emptyCustomersFilters)).toEqual({})
    expect(
      serializeCustomersFilters({
        ...emptyCustomersFilters,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-09',
      })
    ).toEqual({ date_from: '2026-10-01', date_to: '2026-10-09' })
  })

  it('rejects invalid date ranges', () => {
    const filters = { ...emptyCustomersFilters, dateFrom: '2026-10-10', dateTo: '2026-10-09' }
    expect(validCustomersDateRange(filters)).toBe(false)
    expect(() => serializeCustomersFilters(filters)).toThrow('Invalid customer date range')
  })

  it.each(customerSortValues)('serializes supported sort_by %s', (sortBy) => {
    expect(serializeCustomersFilters({ ...emptyCustomersFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(customerSortDirections)('serializes supported sort_dir %s', (sortDir) => {
    expect(serializeCustomersFilters({ ...emptyCustomersFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('drops unsupported URL values', () => {
    expect(readCustomersFilters({ sort_by: 'id', sort_dir: 'down', search: 'ignored' })).toEqual(emptyCustomersFilters)
  })

  it('includes every active filter in query identity', () => {
    const variants = [
      { dateFrom: '2026-10-01' },
      { dateTo: '2026-10-09' },
      { sortBy: 'email' as const },
      { sortDir: 'desc' as const },
    ]
    const keys = [
      customersKeys.list(emptyCustomersFilters),
      ...variants.map((variant) => customersKeys.list({ ...emptyCustomersFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
