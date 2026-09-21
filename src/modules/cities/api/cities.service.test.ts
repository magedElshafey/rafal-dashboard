import { beforeEach, describe, expect, it } from 'vitest'

import { citiesService, serializeCity, serializeCityUpdate } from './cities.service'
import { resetCitiesMock, seedCitiesMock } from '../mocks/cities.mock'

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

describe('cities service boundary', () => {
  beforeEach(() => resetCitiesMock())

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

  it('preserves boundary order without closing the request and copies center', () => {
    const boundary = [
      { lat: 24.6, lng: 46.5 },
      { lat: 24.9, lng: 46.9 },
      { lat: 24.9, lng: 46.5 },
    ]
    const center = { lat: 24.75, lng: 46.7 }
    const body = serializeCity({ ...base, boundary, center })
    expect(body.boundary).toEqual(boundary)
    expect(body.boundary).not.toBe(boundary)
    expect(body.boundary).toHaveLength(3)
    expect(body.center).toEqual(center)
    expect(body.center).not.toBe(center)
  })

  it('never serializes unfinished coordinates', () => {
    expect(() =>
      serializeCity({
        ...base,
        boundary: [{ lat: Number.NaN, lng: 46.5 }, base.boundary[1], base.boundary[2]],
      })
    ).toThrow('unfinished coordinate')
  })

  it('does not serialize missing or incomplete required geography', () => {
    expect(() => serializeCity({ ...base, center: null })).toThrow('center is required')
    expect(() => serializeCity({ ...base, boundary: base.boundary.slice(0, 2) })).toThrow('boundary is required')
  })

  it('keeps the documented Region 13 relationship on the paginated seed', async () => {
    const page = await citiesService.list(3)
    expect(page.items).toContainEqual(
      expect.objectContaining({
        id: 31,
        name: { ar: 'الخفجي', en: 'Khafji' },
        region_id: 13,
        region: { id: 13, name: { ar: 'الجزيرة المحايدة', en: 'Neutral Zone' } },
      })
    )
  })

  it('mock create closes only its response ring and does not mutate frontend input', async () => {
    seedCitiesMock([])
    const boundary = [
      { lat: 24.6, lng: 46.5 },
      { lat: 24.6, lng: 46.9 },
      { lat: 24.9, lng: 46.9 },
      { lat: 24.9, lng: 46.5 },
    ]
    const response = await citiesService.create({ ...base, boundary })
    expect(boundary).toHaveLength(4)
    expect(response.data.boundary).toEqual([...boundary, boundary[0]])
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

  it('serializes center and an unclosed boundary as atomic multipart values without mutating input', () => {
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

  it('mock update replaces provided fields, preserves omitted fields, and closes only its response boundary', async () => {
    const before = (await citiesService.list(1)).items[0]
    const boundary = base.boundary.map((point) => ({ ...point }))
    const response = await citiesService.update(before.id, {
      regionId: 2,
      nameEn: 'Riyadh New',
      isActive: false,
      sortOrder: -1,
      center: base.center,
      boundary,
    })
    expect(response.data).toMatchObject({
      id: before.id,
      name: { ar: before.name.ar, en: 'Riyadh New' },
      region_id: 2,
      center: base.center,
      is_active: false,
      sort_order: -1,
    })
    expect(response.data.boundary).toEqual([...boundary, boundary[0]])
    expect(boundary).toHaveLength(3)
  })

  it('mock delete removes the City from the in-memory dataset', async () => {
    const before = await citiesService.list(1)
    await citiesService.delete(before.items[0].id)
    const after = await citiesService.list(1)
    expect(after.paginate.total).toBe(before.paginate.total - 1)
    expect(after.items).not.toContainEqual(expect.objectContaining({ id: before.items[0].id }))
  })
})
