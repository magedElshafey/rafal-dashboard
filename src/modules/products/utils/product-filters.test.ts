import { describe, expect, it } from 'vitest'
import { productsKeys } from '../queries/products.keys'
import {
  emptyProductsFilters,
  productSortDirections,
  productSortValues,
  readProductsFilters,
  serializeProductsFilters,
  validProductCreatedRange,
  validProductPriceRange,
  validProductsRanges,
} from './product-filters'

describe('Products server query serialization', () => {
  it('omits inactive values while preserving false booleans and numeric zero', () => {
    expect(serializeProductsFilters(emptyProductsFilters)).toEqual({})
    expect(
      serializeProductsFilters({
        ...emptyProductsFilters,
        isPersonalizable: false,
        isNewArrival: false,
        hasDiscount: false,
        priceMin: 0,
        priceMax: 0,
      })
    ).toEqual({
      is_personalizable: 0,
      is_new_arrival: 0,
      has_discount: 0,
      price_min: 0,
      price_max: 0,
    })
  })

  it.each(productSortValues)('serializes supported sort_by %s', (sortBy) => {
    expect(serializeProductsFilters({ ...emptyProductsFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(productSortDirections)('serializes supported sort_dir %s', (sortDir) => {
    expect(serializeProductsFilters({ ...emptyProductsFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('reads only supported URL values and keeps calendar dates unchanged', () => {
    expect(
      readProductsFilters({
        is_personalizable: '0',
        is_new_arrival: '1',
        has_discount: '0',
        price_min: '0',
        price_max: '25.5',
        created_from: '2026-10-01',
        created_to: '2026-10-09',
        sort_by: 'rating_average',
        sort_dir: 'desc',
        unsupported: 'ignored',
      })
    ).toEqual({
      isPersonalizable: false,
      isNewArrival: true,
      hasDiscount: false,
      priceMin: 0,
      priceMax: 25.5,
      createdFrom: '2026-10-01',
      createdTo: '2026-10-09',
      sortBy: 'rating_average',
      sortDir: 'desc',
    })
    expect(readProductsFilters({ sort_by: 'sku', sort_dir: 'down' })).toEqual(emptyProductsFilters)
  })

  it.each([
    { priceMin: 20, priceMax: 10 },
    { createdFrom: '2026-10-10', createdTo: '2026-10-09' },
    { createdFrom: '2026-02-30' },
  ])('rejects invalid ranges %#', (range) => {
    const filters = { ...emptyProductsFilters, ...range }
    expect(validProductsRanges(filters)).toBe(false)
    expect(() => serializeProductsFilters(filters)).toThrow('Invalid product filter range')
  })

  it('validates price and created ranges independently', () => {
    const invalidPrice = { ...emptyProductsFilters, priceMin: 20, priceMax: 10 }
    const invalidCreated = {
      ...emptyProductsFilters,
      createdFrom: '2026-10-10',
      createdTo: '2026-10-09',
    }

    expect(validProductPriceRange(invalidPrice)).toBe(false)
    expect(validProductCreatedRange(invalidPrice)).toBe(true)
    expect(validProductPriceRange(invalidCreated)).toBe(true)
    expect(validProductCreatedRange(invalidCreated)).toBe(false)
  })

  it('puts every active filter in the list query identity', () => {
    const variants = [
      { isPersonalizable: false },
      { isNewArrival: true },
      { hasDiscount: false },
      { priceMin: 0 },
      { priceMax: 100 },
      { createdFrom: '2026-10-01' },
      { createdTo: '2026-10-09' },
      { sortBy: 'name' as const },
      { sortDir: 'desc' as const },
    ]
    const keys = [
      productsKeys.list(emptyProductsFilters),
      ...variants.map((variant) => productsKeys.list({ ...emptyProductsFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
