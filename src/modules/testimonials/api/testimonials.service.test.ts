import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  normalizeTestimonial,
  serializeTestimonial,
  testimonialsService,
} from '@/modules/testimonials/api/testimonials.service'
import type { RawTestimonial, TestimonialWritePayload } from '@/modules/testimonials/types/testimonial.types'

const rawTestimonial: RawTestimonial = {
  id: 4,
  name: { ar: 'سارة أحمد', en: 'Sarah Ahmed' },
  title: { ar: 'الرياض', en: 'Riyadh' },
  comment: { ar: 'خدمة ممتازة.', en: 'Excellent service.' },
  rating: '4',
  sort_order: '0',
  is_published: 1,
  avatar_url: null,
  created_at: '2026-09-28T17:40:41+00:00',
  updated_at: '2026-09-29T17:40:41+00:00',
}

const payload: TestimonialWritePayload = {
  name: { ar: ' سارة أحمد ', en: ' Sarah Ahmed ' },
  title: { ar: ' الرياض ', en: ' Riyadh ' },
  comment: { ar: ' خدمة ممتازة. ', en: ' Excellent service. ' },
  rating: 4,
  sortOrder: 0,
  isPublished: false,
}

function formEntries(body: FormData) {
  return Object.fromEntries(body.entries())
}

describe('testimonialsService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the paginated Index endpoint with only page and normalizes snake_case values', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [rawTestimonial],
        meta: { current_page: 2, last_page: 3, per_page: 15, total: 31 },
      },
    })

    const result = await testimonialsService.list(2, signal)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/testimonials',
      query: { page: 2 },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.paginate).toMatchObject({ current_page: 2, total_pages: 3, per_page: 15, total: 31 })
    expect(result.items[0]).toEqual({
      id: 4,
      name: rawTestimonial.name,
      title: rawTestimonial.title,
      comment: rawTestimonial.comment,
      rating: 4,
      sortOrder: 0,
      isPublished: true,
      avatarUrl: null,
      createdAt: rawTestimonial.created_at,
      updatedAt: rawTestimonial.updated_at,
    })
  })

  it('normalizes numeric and boolean domain fields', () => {
    expect(normalizeTestimonial({ ...rawTestimonial, rating: 5, sort_order: 7, is_published: false })).toMatchObject({
      rating: 5,
      sortOrder: 7,
      isPublished: false,
    })
  })

  it('serializes all required multipart fields, preserves zero, and omits an absent avatar', () => {
    const body = serializeTestimonial(payload)
    expect(formEntries(body)).toEqual({
      'name[ar]': 'سارة أحمد',
      'name[en]': 'Sarah Ahmed',
      'title[ar]': 'الرياض',
      'title[en]': 'Riyadh',
      'comment[ar]': 'خدمة ممتازة.',
      'comment[en]': 'Excellent service.',
      rating: '4',
      sort_order: '0',
      is_published: '0',
    })
    expect(body.has('avatar')).toBe(false)
    expect(body.has('avatar_url')).toBe(false)
  })

  it('serializes true as 1 and appends the exact selected avatar File', () => {
    const avatar = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const body = serializeTestimonial({ ...payload, isPublished: true, avatar })
    expect(body.get('is_published')).toBe('1')
    expect(body.get('avatar')).toBe(avatar)
  })

  it('uses multipart Create and full-body Update without requiring Update entity data', async () => {
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'created', data: rawTestimonial } })
    httpMocks.put.mockResolvedValue({ data: { success: true, message: 'updated' } })

    await testimonialsService.create(payload)
    await expect(testimonialsService.update(4, payload)).resolves.toEqual({ success: true, message: 'updated' })

    expect(httpMocks.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/testimonials', isFormData: true })
    )
    expect(httpMocks.put).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/testimonials/4', isFormData: true })
    )
    expect(formEntries(httpMocks.put.mock.calls[0][0].data)).toEqual(formEntries(serializeTestimonial(payload)))
  })

  it('sends Delete to the exact endpoint without a body', async () => {
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
    await testimonialsService.delete(9)
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/testimonials/9',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
