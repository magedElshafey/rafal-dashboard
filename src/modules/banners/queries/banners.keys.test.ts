import { describe, expect, it } from 'vitest'

import { bannersKeys } from './banners.keys'

describe('bannersKeys', () => {
  it('keeps list and detail cache scopes stable and separate', () => {
    expect(bannersKeys.list()).toEqual(['banners', 'list'])
    expect(bannersKeys.detail(42)).toEqual(['banners', 'detail', 42])
  })
})
