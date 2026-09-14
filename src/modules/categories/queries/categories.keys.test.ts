import { describe, expect, it } from 'vitest'

import { categoriesKeys } from './categories.keys'

describe('categoriesKeys', () => {
  it('keeps list and detail cache scopes stable and separate', () => {
    expect(categoriesKeys.list()).toEqual(['categories', 'list'])
    expect(categoriesKeys.detail(7)).toEqual(['categories', 'detail', 7])
  })
})
