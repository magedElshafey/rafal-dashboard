import { describe, expect, it } from 'vitest'
import { shippingMethodsKeys } from '../queries/shipping-methods.keys'
import {
  emptyShippingMethodsFilters,
  readShippingMethodsFilters,
  serializeShippingMethodsFilters,
  shippingMethodSortDirections,
  shippingMethodSortValues,
} from './shipping-method-filters'

describe('Shipping Methods server query filters', () => {
  it.each(shippingMethodSortValues)('serializes sort_by=%s', (sortBy) => {
    expect(serializeShippingMethodsFilters({ ...emptyShippingMethodsFilters, sortBy })).toEqual({
      sort_by: sortBy,
    })
  })

  it.each(shippingMethodSortDirections)('serializes sort_dir=%s', (sortDir) => {
    expect(serializeShippingMethodsFilters({ ...emptyShippingMethodsFilters, sortDir })).toEqual({
      sort_dir: sortDir,
    })
  })

  it('ignores unsupported sorting and omits inactive or unsupported parameters', () => {
    expect(
      readShippingMethodsFilters({
        sort_by: 'name',
        sort_dir: 'down',
        search: 'ignored',
        per_page: '50',
        is_active: '1',
      })
    ).toEqual(emptyShippingMethodsFilters)
    expect(serializeShippingMethodsFilters(emptyShippingMethodsFilters)).toEqual({})
  })

  it('includes active filters in query identity', () => {
    expect(shippingMethodsKeys.list({ ...emptyShippingMethodsFilters, sortBy: 'code' })).not.toEqual(
      shippingMethodsKeys.list()
    )
  })
})
