import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { bannersService, normalizeBanner, serializeBanner } from './banners.service'
import { emptyBannersFilters } from '../utils/banner-filters'

const payload = {
  placement: 'home' as const,
  title: { ar: 'العنوان', en: 'Title' },
  position: 'hero' as const,
  product_id: 37,
  category_id: null,
  link_url: null,
  platform: 'both' as const,
  starts_at: null,
  ends_at: null,
  is_active: true,
  sort_order: 4,
}

describe('banners service boundary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('serializes the documented multipart fields and only includes a changed image', () => {
    const withoutImage = serializeBanner(payload)
    expect(withoutImage.get('title[ar]')).toBe('العنوان')
    expect(withoutImage.get('title[en]')).toBe('Title')
    expect(withoutImage.has('link_url')).toBe(false)
    expect(withoutImage.has('destination_type')).toBe(false)
    expect(withoutImage.get('placement')).toBe('home')
    expect(withoutImage.get('position')).toBe('hero')
    expect(withoutImage.get('product_id')).toBe('37')
    expect(withoutImage.get('category_id')).toBe('')
    expect(withoutImage.get('is_active')).toBe('1')
    expect(withoutImage.get('sort_order')).toBe('4')
    expect(withoutImage.has('image')).toBe(false)
    expect(withoutImage.has('starts_at')).toBe(false)

    const image = new File(['image'], 'banner.png', { type: 'image/png' })
    expect(serializeBanner({ ...payload, image }).get('image')).toBe(image)
  })

  it('normalizes inconsistent sort order responses to a domain number', () => {
    const normalized = normalizeBanner({
      id: 49,
      ...payload,
      sort_order: '4',
      image_url: 'https://example.test/banner.png',
      created_at: '2026-09-06T20:01:03+00:00',
      updated_at: '2026-09-06T20:01:03+00:00',
    })
    expect(normalized.sort_order).toBe(4)
  })

  it('sends supported list filters server-side and preserves false booleans', async () => {
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [],
        meta: { current_page: 2, last_page: 2, per_page: 15, total: 16 },
      },
    })
    const signal = new AbortController().signal
    await bannersService.list(2, signal, {
      ...emptyBannersFilters,
      platform: 'mobile',
      isActive: false,
      activeNow: true,
      sortBy: 'starts_at',
      sortDir: 'desc',
    })
    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/banners',
      query: {
        platform: 'mobile',
        is_active: 0,
        active_now: 1,
        sort_by: 'starts_at',
        sort_dir: 'desc',
        page: 2,
      },
      signal,
      suppressErrorNotification: true,
    })
  })

  it('calls only the real Banner endpoints through shared HTTP', async () => {
    const rawBanner = {
      id: 49,
      ...payload,
      sort_order: '4',
      image_url: 'https://example.test/banner.png',
      created_at: '2026-09-06T20:01:03+00:00',
      updated_at: '2026-09-06T20:01:03+00:00',
    }
    const listResponse = {
      success: true,
      message: 'ok',
      data: [rawBanner],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    }
    const itemResponse = { success: true, message: 'ok', data: rawBanner }
    httpMocks.get.mockResolvedValueOnce({ data: listResponse }).mockResolvedValueOnce({ data: itemResponse })
    httpMocks.post.mockResolvedValue({ data: itemResponse })
    httpMocks.put.mockResolvedValue({ data: itemResponse })
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })

    await expect(bannersService.list(1)).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 49, sort_order: 4 })],
      paginate: { total: 1 },
    })
    await bannersService.show(49)
    await bannersService.create(payload)
    await bannersService.update(49, payload)
    expect(httpMocks.post.mock.calls[0][0].data.get('placement')).toBe('home')
    expect(httpMocks.put.mock.calls[0][0].data.get('placement')).toBe('home')
    await bannersService.delete(49)

    expect(httpMocks.get).toHaveBeenNthCalledWith(1, {
      url: '/dashboard/banners',
      query: { page: 1 },
      signal: undefined,
      suppressErrorNotification: true,
    })
    expect(httpMocks.get).toHaveBeenNthCalledWith(2, {
      url: '/dashboard/banners/49',
      signal: undefined,
      suppressErrorNotification: true,
    })
    expect(httpMocks.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/banners', data: expect.any(FormData), isFormData: true })
    )
    expect(httpMocks.put).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/banners/49', data: expect.any(FormData), isFormData: true })
    )
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/banners/49',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})

it.each([
  { product_id: null, category_id: null },
  { product_id: 37, category_id: 12 },
  { product_id: 0, category_id: null },
  { product_id: -1, category_id: null },
  { product_id: Number.MAX_SAFE_INTEGER + 1, category_id: null },
])('rejects invalid destinations before HTTP: %s', destination => {
  expect(() => serializeBanner({ ...payload, ...destination })).toThrow()
})

it('serializes a category destination and clears the product explicitly', () => {
  const body = serializeBanner({ ...payload, position: 'gifts', product_id: null, category_id: 12 })
  expect(body.get('product_id')).toBe('')
  expect(body.get('category_id')).toBe('12')
  expect(body.get('position')).toBe('gifts')
  expect(body.has('link_url')).toBe(false)
})

it('normalizes string IDs without silently repairing conflicting destinations', () => {
  const normalized = normalizeBanner({
    ...payload, id: 1, product_id: '37', category_id: '12', image_url: '', created_at: '', updated_at: '',
  })
  expect(normalized.product_id).toBe(37)
  expect(normalized.category_id).toBe(12)
})

it('preserves historical splash responses but forces home on update', async () => {
  const historical = normalizeBanner({
    ...payload, placement: 'splash', id: 49, image_url: '', created_at: '', updated_at: '',
  })
  expect(historical.placement).toBe('splash')
  httpMocks.put.mockClear()
  httpMocks.put.mockResolvedValue({ data: { success: true, message: 'ok', data: historical } })
  await bannersService.update(49, { ...historical, position: 'hero' })
  expect(httpMocks.put.mock.calls[0][0].data.get('placement')).toBe('home')
})

it.each([undefined, 'unknown'])('normalizes invalid position %s to explicit correction', position => {
  expect(normalizeBanner({
    ...payload, position, id: 49, image_url: '', created_at: '', updated_at: '',
  }).position).toBeNull()
})
