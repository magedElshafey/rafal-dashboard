import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { City } from '@/modules/cities/types/city.types'

const httpMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/utils/http', () => ({
  $http: {
    get: httpMocks.get,
    post: httpMocks.post,
    put: httpMocks.put,
    delete: httpMocks.delete,
  },
}))

import { citiesService } from './cities.service'

const city: City = {
  id: 37,
  region_id: 1,
  region: { id: 1, name: { ar: 'منطقة الرياض', en: 'Riyadh Region' } },
  name: { ar: 'الدرعية', en: 'Diriyah' },
  boundary: null,
  center: null,
  is_active: true,
  sort_order: 1,
  created_at: '2026-09-17T18:33:53+00:00',
  updated_at: '2026-09-17T18:34:57+00:00',
}

describe('Cities HTTP transport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('PUTs the exact partial multipart data to the City resource', async () => {
    httpMocks.put.mockResolvedValue({ data: { success: true, message: 'updated', data: city } })
    await citiesService.update(37, { nameEn: ' Diriyah test ', isActive: false })
    expect(httpMocks.put).toHaveBeenCalledTimes(1)
    const request = httpMocks.put.mock.calls[0][0]
    expect(request).toMatchObject({
      url: '/dashboard/cities/37',
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect([...request.data.entries()]).toEqual([
      ['name[en]', 'Diriyah test'],
      ['is_active', '0'],
    ])
  })

  it('DELETEs the City resource without a request body', async () => {
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
    await citiesService.delete(37)
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/cities/37',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect(httpMocks.delete.mock.calls[0][0]).not.toHaveProperty('data')
  })

  it('GETs the real collection and POSTs the confirmed Create JSON', async () => {
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [city],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
      },
    })
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'created', data: city } })
    const createPayload = {
      regionId: 1,
      name: city.name,
      boundary: [
        { lat: 24.6, lng: 46.5 },
        { lat: 24.9, lng: 46.9 },
        { lat: 24.9, lng: 46.5 },
      ],
      center: { lat: 24.75, lng: 46.7 },
      isActive: true,
      sortOrder: 1,
    }

    await expect(citiesService.list(1)).resolves.toMatchObject({ items: [city], paginate: { total: 1 } })
    await citiesService.create(createPayload)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/cities',
      query: { page: 1 },
      signal: undefined,
      suppressErrorNotification: true,
    })
    expect(httpMocks.post).toHaveBeenCalledWith({
      url: '/dashboard/cities',
      data: {
        region_id: 1,
        name: city.name,
        boundary: createPayload.boundary,
        center: createPayload.center,
        is_active: true,
        sort_order: 1,
      },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
