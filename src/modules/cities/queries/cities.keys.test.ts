import { describe, expect, it } from 'vitest'

import { citiesKeys } from './cities.keys'
import { emptyCitiesFilters } from '../utils/city-filters'

describe('citiesKeys', () => {
  it('scopes list keys under Cities', () => {
    expect(citiesKeys.all).toEqual(['cities'])
    expect(citiesKeys.lists()).toEqual(['cities', 'list'])
    expect(citiesKeys.list(emptyCitiesFilters)).toEqual(['cities', 'list', emptyCitiesFilters])
  })
})
