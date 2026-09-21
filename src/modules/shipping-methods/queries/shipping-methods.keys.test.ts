import { describe, expect, it } from 'vitest'

import { shippingMethodsKeys } from './shipping-methods.keys'

describe('shippingMethodsKeys', () => {
  it('uses list-only keys because no Show endpoint exists', () => {
    expect(shippingMethodsKeys.all).toEqual(['shipping-methods'])
    expect(shippingMethodsKeys.lists()).toEqual(['shipping-methods', 'list'])
    expect(shippingMethodsKeys.list()).toEqual(['shipping-methods', 'list'])
  })
})
