import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  normalizeWarehouseDetail,
  serializeWarehouseCreate,
  serializeWarehouseUpdate,
  warehousesService,
} from './warehouses.service'
import type { RawWarehouseUpdatePayload, WarehouseUpdatePayload } from '../types/warehouse.types'
import { emptyWarehousesFilters } from '../utils/warehouse-filters'

const rawListItem = {
  id: 1,
  name: 'Riyadh Central Warehouse',
  is_active: true,
  created_at: '2026-09-22T17:19:08+00:00',
  updated_at: '2026-09-22T17:19:08+00:00',
}

const rawDetail = {
  ...rawListItem,
  cities: [{ id: 17, name: { ar: 'الرياض', en: 'Riyadh' } }],
}

describe('warehousesService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls the exact paginated Index endpoint and normalizes list rows', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [rawListItem],
        meta: { current_page: 2, last_page: 3, per_page: 15, total: 31 },
      },
    })

    const result = await warehousesService.list(2, signal, {
      ...emptyWarehousesFilters,
      cityId: 17,
      createdFrom: '2026-10-01',
      createdTo: '2026-10-09',
      sortBy: 'created_at',
      sortDir: 'desc',
    })

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/warehouses',
      query: {
        city_id: 17,
        created_from: '2026-10-01',
        created_to: '2026-10-09',
        sort_by: 'created_at',
        sort_dir: 'desc',
        page: 2,
      },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.items).toEqual([
      {
        id: 1,
        name: 'Riyadh Central Warehouse',
        isActive: true,
        createdAt: rawListItem.created_at,
        updatedAt: rawListItem.updated_at,
      },
    ])
    expect(result.paginate).toMatchObject({ current_page: 2, total_pages: 3, total: 31 })
  })

  it('calls Show and normalizes localized City data', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: rawDetail } })

    await expect(warehousesService.show(1, signal)).resolves.toEqual({
      success: true,
      message: 'ok',
      data: {
        id: 1,
        name: rawDetail.name,
        cities: [{ id: 17, name: { ar: 'الرياض', en: 'Riyadh' } }],
        isActive: true,
        createdAt: rawDetail.created_at,
        updatedAt: rawDetail.updated_at,
      },
    })
    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/warehouses/1',
      signal,
      suppressErrorNotification: true,
    })
  })

  it('POSTs exact JSON fields with numeric boolean and no obsolete writes', async () => {
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'created', data: rawDetail } })
    const payload = { name: ' Riyadh ', cityIds: [17, 18], isActive: false }

    expect(serializeWarehouseCreate(payload)).toEqual({
      name: 'Riyadh',
      city_ids: [17, 18],
      is_active: 0,
    })
    await warehousesService.create(payload)

    expect(httpMocks.post).toHaveBeenCalledWith({
      url: '/dashboard/warehouses',
      data: { name: 'Riyadh', city_ids: [17, 18], is_active: 0 },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    const body = httpMocks.post.mock.calls[0][0].data
    expect(body).not.toBeInstanceOf(FormData)
    expect(body).not.toHaveProperty('slug')
  })

  it.each([
    [{ name: ' North ' }, { name: 'North' }],
    [{ cityIds: [17] }, { city_ids: [17] }],
    [{ isActive: true }, { is_active: 1 }],
    [{ isActive: false }, { is_active: 0 }],
  ] as Array<[WarehouseUpdatePayload, RawWarehouseUpdatePayload]>)(
    'serializes only supplied partial Update fields',
    (payload, expected) => {
      expect(serializeWarehouseUpdate(payload)).toEqual(expected)
    }
  )

  it('PUTs the exact Warehouse endpoint as JSON and normalizes its authoritative response', async () => {
    httpMocks.put.mockResolvedValue({ data: { success: true, message: 'updated', data: rawDetail } })

    const response = await warehousesService.update(1, { cityIds: [17] })

    expect(httpMocks.put).toHaveBeenCalledWith({
      url: '/dashboard/warehouses/1',
      data: { city_ids: [17] },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect(httpMocks.put.mock.calls[0][0].data).not.toBeInstanceOf(FormData)
    expect(response.data.cities).toEqual([{ id: 17, name: { ar: 'الرياض', en: 'Riyadh' } }])
  })

  it('DELETEs the exact endpoint without a request body', async () => {
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })

    await warehousesService.delete(1)

    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/warehouses/1',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })

  it('rejects malformed Warehouse and City IDs instead of coercing them', () => {
    expect(() => normalizeWarehouseDetail({ ...rawDetail, id: 0 })).toThrow('Warehouse ID is unavailable')
    expect(() => normalizeWarehouseDetail({ ...rawDetail, cities: [{ ...rawDetail.cities[0], id: NaN }] })).toThrow(
      'City ID is unavailable'
    )
    expect(() => serializeWarehouseCreate({ name: 'A', cityIds: [0], isActive: true })).toThrow(
      'City ID is unavailable'
    )
  })
})
