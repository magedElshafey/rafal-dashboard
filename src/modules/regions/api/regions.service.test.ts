import { beforeEach, describe, expect, it } from 'vitest'

import { regionsService, serializeRegion } from './regions.service'
import { resetRegionsMock, seedRegionsMock } from '../mocks/regions.mock'

describe('regionsService', () => {
  beforeEach(() => resetRegionsMock())

  it('omits empty optional code and null or undefined sort order values', () => {
    const nullBody = serializeRegion({
      name: { ar: ' الرياض ', en: ' Riyadh ' },
      code: '   ',
      sortOrder: null,
      isActive: false,
    })
    expect([...nullBody.entries()]).toEqual([
      ['name[ar]', 'الرياض'],
      ['name[en]', 'Riyadh'],
      ['is_active', '0'],
    ])
    expect(nullBody.has('code')).toBe(false)
    expect(nullBody.has('sort_order')).toBe(false)

    const undefinedBody = serializeRegion({
      name: { ar: 'الرياض', en: 'Riyadh' },
      isActive: true,
    })
    expect(undefinedBody.has('sort_order')).toBe(false)
  })

  it('includes populated optional code and sort order values', () => {
    const body = serializeRegion({
      name: { ar: 'الرياض', en: 'Riyadh' },
      code: ' RUH ',
      sortOrder: 3,
      isActive: true,
    })
    expect(body.get('code')).toBe('RUH')
    expect(body.get('sort_order')).toBe('3')
  })

  it('preserves zero as a valid sort order', () => {
    const body = serializeRegion({
      name: { ar: 'الرياض', en: 'Riyadh' },
      sortOrder: 0,
      isActive: true,
    })
    expect(body.get('sort_order')).toBe('0')
  })

  it('serializes a negative integer sort order', () => {
    const body = serializeRegion({
      name: { ar: 'الرياض', en: 'Riyadh' },
      sortOrder: -1,
      isActive: true,
    })
    expect(body.get('sort_order')).toBe('-1')
  })

  it('matches the documented initial region dataset', async () => {
    const regions = (await regionsService.list(1)).items
    expect(regions.map(({ name, code }) => ({ name, code }))).toEqual([
      { name: { ar: 'منطقة الرياض', en: 'Riyadh Region' }, code: 'RUH' },
      { name: { ar: 'منطقة مكة المكرمة', en: 'Makkah Region' }, code: 'MKC' },
      { name: { ar: 'المنطقة الشرقية', en: 'Eastern Region' }, code: 'DMM' },
      { name: { ar: 'منطقة المدينة المنورة', en: 'Madinah Region' }, code: 'MED' },
      { name: { ar: 'منطقة القصيم', en: 'Qassim Region' }, code: 'QSM' },
      { name: { ar: 'منطقة الحدود الشمالية', en: 'Northern Borders Region' }, code: 'AJF' },
      { name: { ar: 'منطقة جازان', en: 'Jazan Region' }, code: 'JZN' },
      { name: { ar: 'منطقة عسير', en: 'Asir Region' }, code: 'ABS' },
      { name: { ar: 'منطقة تبوك', en: 'Tabuk Region' }, code: 'TBK' },
      { name: { ar: 'منطقة حائل', en: "Ha'il Region" }, code: 'HAL' },
      { name: { ar: 'منطقة الباحة', en: 'Al-Baha Region' }, code: 'BHA' },
      { name: { ar: 'منطقة نجران', en: 'Najran Region' }, code: 'NJN' },
      { name: { ar: 'الجزيرة المحايدة', en: 'Neutral Zone' }, code: 'NZ' },
    ])
  })

  it('normalizes create responses and mutates the in-memory transport', async () => {
    seedRegionsMock([])
    const created = await regionsService.create({
      name: { ar: 'الرياض', en: 'Riyadh' },
      code: 'RUH',
      sortOrder: 3,
      isActive: true,
    })
    expect(created.data).toMatchObject({ code: 'RUH', sort_order: 3, cities_count: 0 })
    const updated = await regionsService.update(created.data.id, {
      name: { ar: 'منطقة الرياض', en: 'Riyadh Region' },
      code: 'RDH',
      sortOrder: 0,
      isActive: false,
    })
    expect(updated.data).toMatchObject({
      name: { ar: 'منطقة الرياض', en: 'Riyadh Region' },
      code: 'RDH',
      sort_order: 0,
      is_active: false,
    })
    expect((await regionsService.list(1)).items).toHaveLength(1)
    await regionsService.delete(created.data.id)
    expect((await regionsService.list(1)).items).toHaveLength(0)
  })
})
