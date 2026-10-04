import { describe, expect, it } from 'vitest'
import {
  emptyOrdersFilters,
  paymentFilterValues,
  readOrdersFilters,
  serializeOrdersFilters,
  validOrdersDateRange,
} from '../utils/order-filters'
import { ordersKeys } from '../queries/orders.keys'

describe('Orders server query serialization', () => {
  it('isolates current confirmed payment filters', () => expect(paymentFilterValues).toEqual(['paid', 'pending']))
  it.each(['isGift', 'isGuest'] as const)('preserves all/yes/no for %s', (key) => {
    const wireKey = key === 'isGift' ? 'is_gift' : 'is_guest'
    expect(serializeOrdersFilters(emptyOrdersFilters)).not.toHaveProperty(wireKey)
    expect(serializeOrdersFilters({ ...emptyOrdersFilters, [key]: true })).toHaveProperty(wireKey, 1)
    expect(serializeOrdersFilters({ ...emptyOrdersFilters, [key]: false })).toHaveProperty(wireKey, 0)
  })
  it('serializes supported filters with unchanged calendar dates and backend warehouse IDs', () => {
    const filters = readOrdersFilters({
      search: ' RF ',
      status: 'confirmed',
      payment_status: 'paid',
      date_from: '2026-10-01',
      date_to: '2026-10-04',
      warehouse_id: '2',
      is_gift: '0',
      is_guest: '1',
    })
    expect(serializeOrdersFilters(filters)).toEqual({
      search: 'RF',
      status: 'confirmed',
      payment_status: 'paid',
      date_from: '2026-10-01',
      date_to: '2026-10-04',
      warehouse_id: 2,
      is_gift: 0,
      is_guest: 1,
    })
    expect(readOrdersFilters(null)).toEqual(emptyOrdersFilters)
  })
  it.each([
    ['2026-10-05', '2026-10-04'],
    ['2026-02-30', ''],
    ['invalid', ''],
  ])('rejects invalid dates %s %s', (dateFrom, dateTo) => {
    const filters = { ...emptyOrdersFilters, dateFrom, dateTo }
    expect(validOrdersDateRange(filters)).toBe(false)
    expect(() => serializeOrdersFilters(filters)).toThrow()
  })
  it('separates every response-changing filter in the query key', () => {
    const variants = [
      { search: 'x' },
      { status: 'confirmed' },
      { paymentStatus: 'pending' },
      { warehouseId: 2 },
      { dateFrom: '2026-10-01' },
      { dateTo: '2026-10-04' },
      { isGift: true },
      { isGift: false },
      { isGuest: true },
      { isGuest: false },
    ]
    const keys = [
      ordersKeys.list(emptyOrdersFilters),
      ...variants.map((variant) => ordersKeys.list({ ...emptyOrdersFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
