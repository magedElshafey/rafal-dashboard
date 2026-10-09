import { describe, expect, it } from 'vitest'
import { regionsKeys } from '../queries/regions.keys'
import {
  emptyRegionsFilters,
  readRegionsFilters,
  regionSortDirections,
  regionSortValues,
  serializeRegionsFilters,
} from './region-filters'

describe('Regions server query serialization', () => {
  it('omits inactive filters and preserves both is_active states', () => {
    expect(serializeRegionsFilters(emptyRegionsFilters)).toEqual({})
    expect(serializeRegionsFilters({ ...emptyRegionsFilters, isActive: true })).toEqual({ is_active: 1 })
    expect(serializeRegionsFilters({ ...emptyRegionsFilters, isActive: false })).toEqual({ is_active: 0 })
  })

  it.each(regionSortValues)('serializes supported sort_by %s', (sortBy) => {
    expect(serializeRegionsFilters({ ...emptyRegionsFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(regionSortDirections)('serializes supported sort_dir %s', (sortDir) => {
    expect(serializeRegionsFilters({ ...emptyRegionsFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('drops unsupported URL values', () => {
    expect(
      readRegionsFilters({ is_active: 'yes', sort_by: 'id', sort_dir: 'down', per_page: '25', unsupported: 'value' })
    ).toEqual(emptyRegionsFilters)
  })

  it('includes every active filter in query identity', () => {
    const variants = [
      { isActive: true },
      { isActive: false },
      { sortBy: 'code' as const },
      { sortDir: 'desc' as const },
    ]
    const keys = [
      regionsKeys.list(emptyRegionsFilters),
      ...variants.map((variant) => regionsKeys.list({ ...emptyRegionsFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
