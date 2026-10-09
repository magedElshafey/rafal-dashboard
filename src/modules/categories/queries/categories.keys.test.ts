import { describe, expect, it } from 'vitest'

import { categoriesKeys } from './categories.keys'
import { emptyCategoriesFilters } from '../utils/category-filters'

describe('categoriesKeys', () => {
  it('keeps list and detail cache scopes stable and separate', () => {
    expect(categoriesKeys.list(emptyCategoriesFilters)).toEqual(['categories', 'list', emptyCategoriesFilters])
    expect(categoriesKeys.detail(7)).toEqual(['categories', 'detail', 7])
  })
})
