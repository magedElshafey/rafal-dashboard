import { describe, expect, it } from 'vitest'

import { formatAvgGrade } from './avg-grade.helpers'

describe('formatAvgGrade', () => {
  it('formats percentage and letter with the canonical separator', () => {
    expect(formatAvgGrade({ percentage: 60, letter: 'B' })).toBe('60% · B')
  })

  it('omits the separator when the letter is null', () => {
    expect(formatAvgGrade({ percentage: 60, letter: null })).toBe('60%')
  })

  it('preserves zero and decimal percentages', () => {
    expect(formatAvgGrade({ percentage: 0, letter: null })).toBe('0%')
    expect(formatAvgGrade({ percentage: 87.5, letter: 'A' })).toBe('87.5% · A')
  })
})
