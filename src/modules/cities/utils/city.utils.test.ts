import { describe, expect, it } from 'vitest'

import { closeBoundaryRing, getLocalizedName, getLogicalBoundaryPointCount, openBoundaryRing } from './city.utils'

describe('city utilities', () => {
  it('falls back across localized names', () => {
    expect(getLocalizedName({ ar: 'مدينة', en: '' }, 'en')).toBe('مدينة')
    expect(getLocalizedName({ ar: '', en: 'City' }, 'ar')).toBe('City')
  })

  it('opens a backend polygon ring for form hydration without mutating the City boundary', () => {
    const boundary = [
      { lat: 24.6, lng: 46.5 },
      { lat: 24.6, lng: 46.9 },
      { lat: 24.9, lng: 46.9 },
      { lat: 24.6, lng: 46.5 },
    ]
    expect(openBoundaryRing(boundary)).toEqual(boundary.slice(0, -1))
    expect(boundary).toHaveLength(4)
    expect(openBoundaryRing(null)).toEqual([])
  })

  it('does not double count a closing point', () => {
    const boundary = [
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 1, lng: 1 },
    ]
    expect(getLogicalBoundaryPointCount(boundary)).toBe(2)
    expect(getLogicalBoundaryPointCount(null)).toBe(0)
  })

  it('closes a cloned ring once', () => {
    const input = [
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
    ]
    expect(closeBoundaryRing(input)).toEqual([...input, input[0]])
    expect(input).toHaveLength(2)
    expect(closeBoundaryRing([...input, input[0]])).toHaveLength(3)
  })
})
