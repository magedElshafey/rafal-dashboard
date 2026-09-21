import { describe, expect, it } from 'vitest'

import { settingsKeys } from './settings.keys'

describe('settingsKeys', () => {
  it('uses a focused singleton detail key', () => {
    expect(settingsKeys.all).toEqual(['settings'])
    expect(settingsKeys.detail()).toEqual(['settings', 'detail'])
  })
})
