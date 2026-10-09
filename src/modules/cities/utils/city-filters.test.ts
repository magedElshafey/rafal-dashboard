import { describe, expect, it } from 'vitest'
import { citiesKeys } from '../queries/cities.keys'
import {
  citySortDirections,
  citySortValues,
  emptyCitiesFilters,
  readCitiesFilters,
  serializeCitiesFilters,
} from './city-filters'

describe('Cities server query serialization', () => {
  it('omits inactive filters and preserves both is_active states', () => {
    expect(serializeCitiesFilters(emptyCitiesFilters)).toEqual({})
    expect(serializeCitiesFilters({ ...emptyCitiesFilters, isActive: true })).toEqual({ is_active: 1 })
    expect(serializeCitiesFilters({ ...emptyCitiesFilters, isActive: false })).toEqual({ is_active: 0 })
  })

  it.each(citySortValues)('serializes supported sort_by %s', (sortBy) => {
    expect(serializeCitiesFilters({ ...emptyCitiesFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(citySortDirections)('serializes supported sort_dir %s', (sortDir) => {
    expect(serializeCitiesFilters({ ...emptyCitiesFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('drops unsupported URL values, including per_page', () => {
    expect(
      readCitiesFilters({ is_active: 'yes', sort_by: 'code', sort_dir: 'down', per_page: '25', unsupported: 'value' })
    ).toEqual(emptyCitiesFilters)
  })

  it('includes every active filter in query identity', () => {
    const variants = [
      { isActive: true },
      { isActive: false },
      { sortBy: 'name' as const },
      { sortDir: 'desc' as const },
    ]
    const keys = [
      citiesKeys.list(emptyCitiesFilters),
      ...variants.map((variant) => citiesKeys.list({ ...emptyCitiesFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
