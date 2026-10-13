import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reviewModerationTargets, reviewStatuses } from '@/modules/reviews/types/review.types'
import { normalizeStoreRating, storeRatingsService } from './store-ratings.service'
import { rawStoreRating } from '../test/store-rating.fixtures'
import { readStoreRatingsFilters } from '../utils/store-rating-filters'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))

describe('Store Ratings service boundary', () => {
  beforeEach(() => vi.clearAllMocks())
  it('uses the exact Index endpoint, all confirmed filters, AbortSignal and pagination metadata', async () => {
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [rawStoreRating],
        meta: { current_page: 2, last_page: 3, per_page: 15, total: 31 },
      },
    })
    const signal = new AbortController().signal
    const result = await storeRatingsService.list(
      2,
      signal,
      readStoreRatingsFilters({
        user_id: '1',
        rating: '5',
        rating_min: '3',
        rating_max: '5',
        date_from: '2026-09-01',
        date_to: '2026-09-30',
        sort_by: 'rating',
        sort_dir: 'desc',
        search: 'ignored',
        per_page: '100',
        status: 'pending',
        order_id: '47',
      })
    )
    expect(http.get).toHaveBeenCalledExactlyOnceWith({
      url: '/store-ratings',
      signal,
      suppressErrorNotification: true,
      query: {
        page: 2,
        user_id: 1,
        rating: 5,
        rating_min: 3,
        rating_max: 5,
        date_from: '2026-09-01',
        date_to: '2026-09-30',
        sort_by: 'rating',
        sort_dir: 'desc',
      },
    })
    expect(result).toMatchObject({
      items: [
        {
          id: 2,
          rating: 5,
          comment: 'جميل جدا',
          status: 'pending',
          adminResponse: null,
          user: { id: 1, firstName: 'abdullah', lastName: 'essam', email: 'abdullah.essam@gmail.com' },
          order: { id: 47, orderNumber: 'RF-10047' },
          createdAt: rawStoreRating.created_at,
          updatedAt: rawStoreRating.updated_at,
        },
      ],
      paginate: {
        current_page: 2,
        total_pages: 3,
        per_page: 15,
        total: 31,
        count: 1,
        next_page_url: '3',
        prev_page_url: '1',
      },
    })
  })
  it('normalizes nullable/blank feedback and names without inventing content', () => {
    expect(
      normalizeStoreRating({
        ...rawStoreRating,
        rating: '4.5',
        comment: '  ',
        admin_response: ' ',
        user: { ...rawStoreRating.user, first_name: null, last_name: ' ' },
      })
    ).toMatchObject({ rating: 4.5, comment: null, adminResponse: null, user: { firstName: '', lastName: null } })
    expect(normalizeStoreRating({ ...rawStoreRating, comment: null, admin_response: ' Thank you ' })).toMatchObject({
      comment: null,
      adminResponse: 'Thank you',
    })
  })
  it.each(reviewStatuses)('reuses Review status %s', (status) =>
    expect(normalizeStoreRating({ ...rawStoreRating, status }).status).toBe(status)
  )
  it('rejects unsupported status and malformed rating', () => {
    expect(() => normalizeStoreRating({ ...rawStoreRating, status: 'published' })).toThrow()
    expect(() => normalizeStoreRating({ ...rawStoreRating, rating: 'invalid' })).toThrow()
  })
  it.each(reviewModerationTargets)('PATCHes %s as JSON with the exact Store Rating ID', async (status) => {
    http.patch.mockResolvedValue({ data: null })
    await expect(storeRatingsService.moderate(2, status)).resolves.toBeUndefined()
    expect(http.patch).toHaveBeenCalledExactlyOnceWith({
      url: '/store-ratings/2',
      data: { status },
      suppressErrorNotification: true,
      suppressSuccessNotification: true,
    })
    expect(http.patch.mock.calls[0][0].data).not.toBeInstanceOf(FormData)
  })
  it.each([
    { rating_min: '5', rating_max: '2', date_from: '' },
    { rating_min: '', rating_max: '', date_from: '2026-02-30' },
  ])('does not request an invalid range %j', async (query) => {
    await expect(storeRatingsService.list(1, undefined, readStoreRatingsFilters(query))).rejects.toThrow()
    expect(http.get).not.toHaveBeenCalled()
  })
})
