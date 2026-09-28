import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { bannersService, normalizeBanner, serializeBanner } from './banners.service'

const payload = {
  placement: 'home' as const,
  title: { ar: 'العنوان', en: 'Title' },
  link_url: '/products/example',
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
    expect(withoutImage.get('link_url')).toBe('/products/example')
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
