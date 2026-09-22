import { describe, expect, it } from 'vitest'

import { productsKeys } from './products.keys'

describe('productsKeys', () => {
  it('defines only the Milestone 01 list cache hierarchy', () => {
    expect(productsKeys.all).toEqual(['products'])
    expect(productsKeys.lists()).toEqual(['products', 'list'])
    expect(productsKeys.list()).toEqual(['products', 'list'])
    expect(productsKeys).not.toHaveProperty('detail')
  })
})
