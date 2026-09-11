import { describe, expect, it } from 'vitest'

import { formatBytes } from './file-helpers'

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [3240, '3.2 KB'],
    [1024 * 1024, '1.0 MB'],
    [1024 * 1024 * 1024, '1.0 GB'],
  ])('formats %i bytes as %s', (size, expected) => {
    expect(formatBytes(size)).toBe(expected)
  })

  it.each([undefined, null, Number.NaN, Number.POSITIVE_INFINITY, -1])('does not fabricate a size for %s', (size) => {
    expect(formatBytes(size)).toBe('—')
  })
})
