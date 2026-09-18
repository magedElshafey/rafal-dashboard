import { describe, expect, it } from 'vitest'

import { regionsKeys } from './regions.keys'

describe('regionsKeys', () => {
  it('keeps region list invalidation within the region domain', () => {
    expect(regionsKeys.all).toEqual(['regions'])
    expect(regionsKeys.lists()).toEqual(['regions', 'list'])
    expect(regionsKeys.list()).toEqual(['regions', 'list'])
  })
})
