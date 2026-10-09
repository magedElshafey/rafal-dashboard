import { describe, expect, it } from 'vitest'
import { categoriesKeys } from '../queries/categories.keys'
import {
  categorySortDirections,
  categorySortValues,
  emptyCategoriesFilters,
  readCategoriesFilters,
  serializeCategoriesFilters,
  validCategoriesCreatedRange,
} from './category-filters'

describe('Categories server query serialization', () => {
  it('omits inactive filters and preserves both active states', () => {
    expect(serializeCategoriesFilters(emptyCategoriesFilters)).toEqual({})
    expect(serializeCategoriesFilters({ ...emptyCategoriesFilters, isActive: true })).toEqual({ is_active: 1 })
    expect(serializeCategoriesFilters({ ...emptyCategoriesFilters, isActive: false })).toEqual({ is_active: 0 })
  })

  it('serializes created dates unchanged', () => {
    expect(
      serializeCategoriesFilters({
        ...emptyCategoriesFilters,
        createdFrom: '2026-10-01',
        createdTo: '2026-10-09',
      })
    ).toEqual({ created_from: '2026-10-01', created_to: '2026-10-09' })
  })

  it.each(categorySortValues)('serializes supported sort_by %s', (sortBy) => {
    expect(serializeCategoriesFilters({ ...emptyCategoriesFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(categorySortDirections)('serializes supported sort_dir %s', (sortDir) => {
    expect(serializeCategoriesFilters({ ...emptyCategoriesFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('drops unsupported URL values', () => {
    expect(readCategoriesFilters({ is_active: 'yes', sort_by: 'id', sort_dir: 'down', unsupported: 'value' })).toEqual(
      emptyCategoriesFilters
    )
  })

  it.each([
    ['2026-10-10', '2026-10-09'],
    ['2026-02-30', ''],
    ['invalid', ''],
  ])('rejects invalid created date ranges %s %s', (createdFrom, createdTo) => {
    const filters = { ...emptyCategoriesFilters, createdFrom, createdTo }
    expect(validCategoriesCreatedRange(filters)).toBe(false)
    expect(() => serializeCategoriesFilters(filters)).toThrow('Invalid category created date range')
  })

  it('includes every response-changing filter in query identity', () => {
    const variants = [
      { isActive: true },
      { isActive: false },
      { createdFrom: '2026-10-01' },
      { createdTo: '2026-10-09' },
      { sortBy: 'name' as const },
      { sortDir: 'desc' as const },
    ]
    const keys = [
      categoriesKeys.list(emptyCategoriesFilters),
      ...variants.map((variant) => categoriesKeys.list({ ...emptyCategoriesFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
