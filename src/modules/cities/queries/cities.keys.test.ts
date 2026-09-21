import { describe, expect, it } from 'vitest'

import { citiesKeys } from './cities.keys'

describe('citiesKeys', () => {
  it('scopes list keys under Cities', () => {
    expect(citiesKeys.all).toEqual(['cities'])
    expect(citiesKeys.lists()).toEqual(['cities', 'list'])
    expect(citiesKeys.list()).toEqual(['cities', 'list'])
  })
})
