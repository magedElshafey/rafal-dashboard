import { describe, expect, it } from 'vitest'

import { serializeCity, serializeCityUpdate } from './cities.service'

const base = {
  regionId: 1,
  name: { ar: ' الدرعية ', en: ' Diriyah ' },
  isActive: true,
  sortOrder: null,
  boundary: [
    { lat: 24.6, lng: 46.5 },
    { lat: 24.9, lng: 46.9 },
    { lat: 24.9, lng: 46.5 },
  ],
  center: { lat: 24.75, lng: 46.7 },
}

describe('cities service serialization', () => {
  it('maps camelCase to JSON, trims names, and preserves nullable optional values', () => {
    expect(serializeCity(base)).toEqual({
      region_id: 1,
      name: { ar: 'الدرعية', en: 'Diriyah' },
      is_active: true,
      boundary: base.boundary,
      center: base.center,
    })
  })

  it.each([0, -1])('preserves integer sort order %s', (sortOrder) => {
    expect(serializeCity({ ...base, sortOrder }).sort_order).toBe(sortOrder)
  })

  it('preserves boundary order without closing the request and copies geometry', () => {
    const boundary = base.boundary.map((point) => ({ ...point }))
    const center = { ...base.center }
    const body = serializeCity({ ...base, boundary, center })
    expect(body.boundary).toEqual(boundary)
    expect(body.boundary).not.toBe(boundary)
    expect(body.boundary).toHaveLength(3)
    expect(body.center).toEqual(center)
    expect(body.center).not.toBe(center)
  })

  it('rejects missing, incomplete, or unfinished required geography', () => {
    expect(() => serializeCity({ ...base, center: null })).toThrow('center is required')
    expect(() => serializeCity({ ...base, boundary: base.boundary.slice(0, 2) })).toThrow('boundary is required')
    expect(() =>
      serializeCity({
        ...base,
        boundary: [{ lat: Number.NaN, lng: 46.5 }, base.boundary[1], base.boundary[2]],
      })
    ).toThrow('unfinished coordinate')
  })

  it.each([
    [{ regionId: 2 }, [['region_id', '2']]],
    [{ nameAr: ' الدرعية الجديدة ' }, [['name[ar]', 'الدرعية الجديدة']]],
    [{ nameEn: ' Diriyah New ' }, [['name[en]', 'Diriyah New']]],
    [{ isActive: true }, [['is_active', '1']]],
    [{ isActive: false }, [['is_active', '0']]],
    [{ sortOrder: 0 }, [['sort_order', '0']]],
    [{ sortOrder: -1 }, [['sort_order', '-1']]],
  ] as const)('serializes one changed scalar field without unrelated multipart entries', (payload, entries) => {
    expect([...serializeCityUpdate(payload).entries()]).toEqual(entries)
  })

  it('serializes center and an unclosed boundary atomically without mutating input', () => {
    const center = { lat: 24.8, lng: 46.8 }
    const boundary = base.boundary.map((point) => ({ ...point }))
    expect([...serializeCityUpdate({ center }).entries()]).toEqual([
      ['center[lat]', '24.8'],
      ['center[lng]', '46.8'],
    ])
    expect([...serializeCityUpdate({ boundary }).entries()]).toEqual([
      ['boundary[0][lat]', '24.6'],
      ['boundary[0][lng]', '46.5'],
      ['boundary[1][lat]', '24.9'],
      ['boundary[1][lng]', '46.9'],
      ['boundary[2][lat]', '24.9'],
      ['boundary[2][lng]', '46.5'],
    ])
    expect(boundary).toEqual(base.boundary)
  })

  it('serializes a combined partial update and omits undefined and null fields', () => {
    expect([
      ...serializeCityUpdate({
        regionId: 2,
        nameEn: 'Diriyah New',
        isActive: false,
        sortOrder: null,
        center: base.center,
      }).entries(),
    ]).toEqual([
      ['region_id', '2'],
      ['name[en]', 'Diriyah New'],
      ['is_active', '0'],
      ['center[lat]', '24.75'],
      ['center[lng]', '46.7'],
    ])
    expect([...serializeCityUpdate({}).entries()]).toEqual([])
  })
})
