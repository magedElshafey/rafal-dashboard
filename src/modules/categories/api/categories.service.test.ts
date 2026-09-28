import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { categoriesService, serializeCategory } from './categories.service'

const rawCategory = {
  id: 7,
  parent_id: null,
  name: { ar: 'مجوهرات', en: 'Jewelry' },
  slug: 'jewelry',
  description: { ar: 'وصف', en: 'Description' },
  is_active: true,
  sort_order: '2',
  image_url: 'https://example.test/category-7.jpg',
  children_count: '0',
  created_at: '2026-09-06T20:01:03+00:00',
  updated_at: '2026-09-06T20:01:03+00:00',
}

const payload = {
  parent_id: null,
  name: { ar: 'مجوهرات', en: 'Jewelry' },
  description: { ar: 'وصف', en: 'Description' },
  is_active: true,
  sort_order: 2,
}

describe('categories service boundary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('serializes all confirmed fields and exactly one image key', () => {
    const image = new File(['image'], 'category.png', { type: 'image/png' })
    const body = serializeCategory({ ...payload, image })

    expect([...body.entries()]).toEqual([
      ['name[ar]', 'مجوهرات'],
      ['name[en]', 'Jewelry'],
      ['is_active', '1'],
      ['sort_order', '2'],
      ['parent_id', ''],
      ['description[ar]', 'وصف'],
      ['description[en]', 'Description'],
      ['image', image],
    ])
    expect(body.getAll('image')).toEqual([image])
    expect(body.has('image[]')).toBe(false)
    expect(body.has('images')).toBe(false)
    expect(body.has('images[]')).toBe(false)
    expect(body.has('slug')).toBe(false)
  })

  it('omits both an unchanged image and an entirely empty normalized description', () => {
    const body = serializeCategory({ ...payload, parent_id: 3, description: null, is_active: false })
    expect(body.get('parent_id')).toBe('3')
    expect(body.get('is_active')).toBe('0')
    expect(body.has('description[ar]')).toBe(false)
    expect(body.has('image')).toBe(false)
    expect(body.has('slug')).toBe(false)
  })

  it('uses the real category endpoints through the shared HTTP client', async () => {
    const indexResponse = {
      success: true,
      message: 'ok',
      data: [rawCategory],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    }
    const itemResponse = { success: true, message: 'ok', data: rawCategory }
    httpMocks.get.mockResolvedValueOnce({ data: indexResponse }).mockResolvedValueOnce({ data: itemResponse })
    httpMocks.post.mockResolvedValue({ data: itemResponse })
    httpMocks.put.mockResolvedValue({ data: itemResponse })
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
    const signal = new AbortController().signal

    await expect(categoriesService.list(1, signal)).resolves.toMatchObject({
      items: [expect.objectContaining({ id: 7, sort_order: 2 })],
      paginate: { current_page: 1, total_pages: 1, total: 1 },
    })
    await categoriesService.show(7, signal)
    await categoriesService.create({
      ...payload,
      image: new File(['image'], 'category.png', { type: 'image/png' }),
    })
    await categoriesService.update(7, payload)
    await categoriesService.delete(7)

    expect(httpMocks.get).toHaveBeenNthCalledWith(1, {
      url: '/dashboard/categories',
      query: { page: 1 },
      signal,
      suppressErrorNotification: true,
    })
    expect(httpMocks.get).toHaveBeenNthCalledWith(2, {
      url: '/dashboard/categories/7',
      signal,
      suppressErrorNotification: true,
    })
    expect(httpMocks.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/categories', data: expect.any(FormData), isFormData: true })
    )
    expect(httpMocks.put).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/categories/7', data: expect.any(FormData), isFormData: true })
    )
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/categories/7',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
