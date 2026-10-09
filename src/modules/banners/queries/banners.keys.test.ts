import { describe, expect, it } from 'vitest'

import { bannersKeys } from './banners.keys'

describe('bannersKeys', () => {
  it('keeps list and detail cache scopes stable and separate', () => {
    expect(bannersKeys.list()).toEqual([
      'banners',
      'list',
      { platform: null, isActive: null, activeNow: null, sortBy: null, sortDir: null },
    ])
    expect(bannersKeys.detail(42)).toEqual(['banners', 'detail', 42])
  })
})
