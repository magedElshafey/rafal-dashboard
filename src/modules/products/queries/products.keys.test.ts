import { describe, expect, it } from 'vitest'

import { productsKeys } from './products.keys'
import { emptyProductsFilters } from '../utils/product-filters'

describe('productsKeys', () => {
  it('defines list and detail cache hierarchies', () => {
    expect(productsKeys.all).toEqual(['products'])
    expect(productsKeys.lists()).toEqual(['products', 'list'])
    expect(productsKeys.list(emptyProductsFilters)).toEqual(['products', 'list', emptyProductsFilters])
    expect(productsKeys.details()).toEqual(['products', 'detail'])
    expect(productsKeys.detail(7)).toEqual(['products', 'detail', 7])
  })
})
