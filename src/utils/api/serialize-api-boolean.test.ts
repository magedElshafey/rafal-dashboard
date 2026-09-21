import { describe, expect, it } from 'vitest'

import { toApiBoolean } from './serialize-api-boolean'

describe('toApiBoolean', () => {
  it('serializes frontend booleans for Laravel writes', () => {
    expect(toApiBoolean(true)).toBe(1)
    expect(toApiBoolean(false)).toBe(0)
  })
})
