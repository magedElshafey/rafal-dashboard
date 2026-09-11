import { describe, expect, it } from 'vitest'

import ar from './ar.json'
import en from './en.json'

function getLeafPaths(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key

    return typeof child === 'object' && child !== null ? getLeafPaths(child, path) : [path]
  })
}

describe('Auth locales', () => {
  it('keeps Arabic and English key coverage equivalent', () => {
    expect(getLeafPaths(ar).sort()).toEqual(getLeafPaths(en).sort())
  })
})
