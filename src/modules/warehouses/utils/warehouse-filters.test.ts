import { describe, expect, it } from 'vitest'
import { warehousesKeys } from '../queries/warehouses.keys'
import {
  emptyWarehousesFilters,
  readWarehousesFilters,
  serializeWarehousesFilters,
  validWarehousesCreatedRange,
  warehouseSortDirections,
  warehouseSortValues,
} from './warehouse-filters'

describe('Warehouses server query serialization', () => {
  it('serializes a numeric city_id and omits an empty city', () => {
    expect(serializeWarehousesFilters(emptyWarehousesFilters)).toEqual({})
    expect(serializeWarehousesFilters({ ...emptyWarehousesFilters, cityId: 17 })).toEqual({ city_id: 17 })
    expect(readWarehousesFilters({ city_id: '17' }).cityId).toBe(17)
    expect(readWarehousesFilters({ city_id: '' }).cityId).toBeNull()
  })

  it('serializes created_from and created_to', () => {
    expect(
      serializeWarehousesFilters({
        ...emptyWarehousesFilters,
        createdFrom: '2026-10-01',
        createdTo: '2026-10-09',
      })
    ).toEqual({ created_from: '2026-10-01', created_to: '2026-10-09' })
  })

  it('rejects invalid created ranges', () => {
    const filters = { ...emptyWarehousesFilters, createdFrom: '2026-10-10', createdTo: '2026-10-09' }
    expect(validWarehousesCreatedRange(filters)).toBe(false)
    expect(() => serializeWarehousesFilters(filters)).toThrow('Invalid warehouse created date range')
  })

  it.each(warehouseSortValues)('serializes supported sort_by %s', (sortBy) => {
    expect(serializeWarehousesFilters({ ...emptyWarehousesFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(warehouseSortDirections)('serializes supported sort_dir %s', (sortDir) => {
    expect(serializeWarehousesFilters({ ...emptyWarehousesFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('drops unsupported URL values', () => {
    expect(readWarehousesFilters({ city_id: 'invalid', sort_by: 'code', sort_dir: 'down' })).toEqual(
      emptyWarehousesFilters
    )
  })

  it('includes every active filter in query identity', () => {
    const variants = [
      { cityId: 17 },
      { createdFrom: '2026-10-01' },
      { createdTo: '2026-10-09' },
      { sortBy: 'name' as const },
      { sortDir: 'desc' as const },
    ]
    const keys = [
      warehousesKeys.list(emptyWarehousesFilters),
      ...variants.map((variant) => warehousesKeys.list({ ...emptyWarehousesFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
