import { describe, expect, it } from 'vitest'

import { productsKeys } from './products.keys'

describe('productsKeys', () => {
  it('defines list and detail cache hierarchies', () => {
    expect(productsKeys.all).toEqual(['products'])
    expect(productsKeys.lists()).toEqual(['products', 'list'])
    expect(productsKeys.list()).toEqual(['products', 'list'])
    expect(productsKeys.details()).toEqual(['products', 'detail'])
    expect(productsKeys.detail(7)).toEqual(['products', 'detail', 7])
  })
})
