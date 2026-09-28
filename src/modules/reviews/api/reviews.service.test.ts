import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { normalizeReview, reviewsService } from '@/modules/reviews/api/reviews.service'
import type { RawReview } from '@/modules/reviews/types/review.types'

// Provisional Index fixture: inferred from the confirmed PATCH moderation response shape.
const provisionalRawReview: RawReview = {
  id: 4,
  rating: 4.5,
  comment: ' good product ',
  status: 'pending',
  admin_response: null,
  helpful_count: 2,
  reports_count: 1,
  user: {
    id: 1,
    first_name: 'abdullah',
    last_name: 'essam',
    email: 'abdullah.essam@gmail.com',
  },
  product: {
    id: 20,
    name: 'Test Product A',
    slug: 'test-product-a',
  },
  created_at: '2026-09-23T17:53:47+00:00',
  updated_at: '2026-09-23T17:55:59+00:00',
}

describe('reviewsService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GETs the exact Index with only page and normalizes the provisional inferred item shape', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [provisionalRawReview],
        meta: { current_page: 2, last_page: 3, per_page: 15, total: 31 },
      },
    })

    const result = await reviewsService.list(2, signal)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/reviews',
      query: { page: 2 },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.items[0]).toEqual({
      id: 4,
      rating: 4.5,
      comment: 'good product',
      status: 'pending',
      adminResponse: null,
      helpfulCount: 2,
      reportsCount: 1,
      reviewer: {
        id: 1,
        firstName: 'abdullah',
        lastName: 'essam',
        email: 'abdullah.essam@gmail.com',
      },
      product: { id: 20, name: 'Test Product A', slug: 'test-product-a' },
      createdAt: provisionalRawReview.created_at,
      updatedAt: provisionalRawReview.updated_at,
    })
  })

  it.each(['approved', 'rejected'] as const)('PATCHes exact JSON for %s with no unrelated fields', async (status) => {
    httpMocks.patch.mockResolvedValue({
      data: {
        success: true,
        message: 'moderated',
        data: { ...provisionalRawReview, status },
      },
    })

    await reviewsService.moderate(4, status)

    expect(httpMocks.patch).toHaveBeenCalledWith({
      url: '/dashboard/reviews/4',
      data: { status },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    const request = httpMocks.patch.mock.calls[0][0]
    expect(request.data).toEqual({ status })
    expect(request.data).not.toBeInstanceOf(FormData)
    expect(Object.keys(request.data)).toEqual(['status'])
    expect(request).not.toHaveProperty('isFormData')
  })

  it.each([1, 4.5, 5])('accepts rating %s including valid floating values', (rating) => {
    expect(normalizeReview({ ...provisionalRawReview, rating }).rating).toBe(rating)
  })

  it.each([0.5, 5.1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid rating %s', (rating) => {
    expect(() => normalizeReview({ ...provisionalRawReview, rating })).toThrow('Review rating is unavailable')
  })

  it('requires comment, user, product, valid counts, and confirmed status values', () => {
    expect(() => normalizeReview({ ...provisionalRawReview, comment: '   ' })).toThrow('Review comment is unavailable')
    expect(() => normalizeReview({ ...provisionalRawReview, user: null })).toThrow('Review user is unavailable')
    expect(() => normalizeReview({ ...provisionalRawReview, product: null })).toThrow('Review product is unavailable')
    expect(() => normalizeReview({ ...provisionalRawReview, helpful_count: -1 })).toThrow(
      'Review helpful count is unavailable'
    )
    expect(() => normalizeReview({ ...provisionalRawReview, reports_count: 1.5 })).toThrow(
      'Review reports count is unavailable'
    )
    expect(() => normalizeReview({ ...provisionalRawReview, status: 'archived' })).toThrow(
      'Review status is unavailable'
    )
  })
})
