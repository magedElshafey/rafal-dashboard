import { describe, expect, it } from 'vitest'

import { getLocalizedRegionName } from './region.utils'

describe('getLocalizedRegionName', () => {
  it('uses the current locale and falls back to the available translation', () => {
    expect(getLocalizedRegionName({ ar: 'الرياض', en: 'Riyadh' }, 'ar-SA')).toBe('الرياض')
    expect(getLocalizedRegionName({ ar: 'الرياض', en: '' }, 'en')).toBe('الرياض')
    expect(getLocalizedRegionName({ ar: '', en: '' }, 'en')).toBe('—')
  })
})
