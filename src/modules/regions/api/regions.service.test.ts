import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { regionsService, serializeRegion } from './regions.service'
import { emptyRegionsFilters } from '../utils/region-filters'

const rawRegion = {
  id: 1,
  name: { ar: 'منطقة الرياض', en: 'Riyadh Region' },
  code: 'RUH',
  is_active: true,
  sort_order: 1,
  created_at: '2026-09-17T18:09:21+00:00',
  updated_at: '2026-09-17T18:09:21+00:00',
}

const payload = {
  name: { ar: ' الرياض ', en: ' Riyadh ' },
  code: ' RUH ',
  sortOrder: 3,
  isActive: true,
}

describe('regions service boundary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('omits empty optional code and absent sort order values', () => {
    const body = serializeRegion({ ...payload, code: '   ', sortOrder: null, isActive: false })
    expect([...body.entries()]).toEqual([
      ['name[ar]', 'الرياض'],
      ['name[en]', 'Riyadh'],
      ['is_active', '0'],
    ])
  })

  it.each([0, -1, 3])('preserves integer sort order %s and trims code', (sortOrder) => {
    const body = serializeRegion({ ...payload, sortOrder })
    expect(body.get('code')).toBe('RUH')
    expect(body.get('sort_order')).toBe(String(sortOrder))
  })

  it('calls only the real Region endpoints through shared HTTP', async () => {
    const listResponse = {
      success: true,
      message: 'ok',
      data: [rawRegion],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    }
    const itemResponse = { success: true, message: 'ok', data: rawRegion }
    httpMocks.get.mockResolvedValue({ data: listResponse })
    httpMocks.post.mockResolvedValue({ data: itemResponse })
    httpMocks.put.mockResolvedValue({ data: itemResponse })
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })

    const filters = {
      ...emptyRegionsFilters,
      isActive: false,
      sortBy: 'code' as const,
      sortDir: 'desc' as const,
    }
    await expect(regionsService.list(1, undefined, filters)).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 1, cities_count: 0 })],
      paginate: { total: 1 },
    })
    await regionsService.create(payload)
    await regionsService.update(1, payload)
    await regionsService.delete(1)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/regions',
      query: { is_active: 0, sort_by: 'code', sort_dir: 'desc', page: 1 },
      signal: undefined,
      suppressErrorNotification: true,
    })
    expect(httpMocks.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/regions', data: expect.any(FormData), isFormData: true })
    )
    expect(httpMocks.put).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/regions/1', data: expect.any(FormData), isFormData: true })
    )
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/regions/1',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
