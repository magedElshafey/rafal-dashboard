import { describe, expect, it } from 'vitest'

import {
  getSaudiArabiaMapOptions,
  OPENFREEMAP_LIBERTY_STYLE_URL,
  SAUDI_ARABIA_DEFAULT_VIEW,
  SAUDI_ARABIA_MAP_BOUNDS,
  SAUDI_ARABIA_MIN_ZOOM,
  resolveMapStyleUrl,
} from './map'

describe('map configuration', () => {
  it('uses the configured public style URL', () => {
    expect(resolveMapStyleUrl(' https://maps.example/style.json ', true)).toBe('https://maps.example/style.json')
  })

  it('uses the centralized OpenFreeMap default only when development configuration is missing', () => {
    expect(resolveMapStyleUrl('', true)).toBe(OPENFREEMAP_LIBERTY_STYLE_URL)
    expect(resolveMapStyleUrl(undefined, false)).toBe('')
  })

  it('provides centralized Saudi-only MapLibre navigation options without a domain center', () => {
    const options = getSaudiArabiaMapOptions()
    expect(options).toEqual({
      center: [...SAUDI_ARABIA_DEFAULT_VIEW.center],
      zoom: SAUDI_ARABIA_DEFAULT_VIEW.zoom,
      minZoom: SAUDI_ARABIA_MIN_ZOOM,
      maxBounds: SAUDI_ARABIA_MAP_BOUNDS.map((coordinate) => [...coordinate]),
      renderWorldCopies: false,
    })
    expect(options.center).not.toBe(SAUDI_ARABIA_DEFAULT_VIEW.center)
    expect(options.maxBounds).not.toBe(SAUDI_ARABIA_MAP_BOUNDS)
  })
})
