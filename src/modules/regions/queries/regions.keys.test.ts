import { describe, expect, it } from 'vitest'

import { regionsKeys } from './regions.keys'
import { emptyRegionsFilters } from '../utils/region-filters'

describe('regionsKeys', () => {
  it('keeps region list invalidation within the region domain', () => {
    expect(regionsKeys.all).toEqual(['regions'])
    expect(regionsKeys.lists()).toEqual(['regions', 'list'])
    expect(regionsKeys.list(emptyRegionsFilters)).toEqual(['regions', 'list', emptyRegionsFilters])
  })
})
