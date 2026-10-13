import {
  reviewModerationTargets,
  reviewStatuses,
  type ReviewModerationTarget,
} from '@/modules/reviews/types/review.types'
import type {
  RawStoreRating,
  StoreRating,
  StoreRatingsFilters,
  StoreRatingsIndexResponse,
} from '../types/store-rating.types'
import { emptyStoreRatingsFilters, serializeStoreRatingsFilters } from '../utils/store-rating-filters'
import { $http } from '@/utils/http'

function id(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Store rating ID is unavailable')
  return value
}

export function normalizeStoreRating(raw: RawStoreRating): StoreRating {
  const status = reviewStatuses.find((value) => value === raw.status)
  const rating = typeof raw.rating === 'number' ? raw.rating : Number(raw.rating.trim())
  if (!status || !Number.isFinite(rating) || rating < 1 || rating > 5 || !raw.user || !raw.order) {
    throw new Error('Store rating is unavailable')
  }
  const email = raw.user.email?.trim()
  const orderNumber = raw.order.order_number.trim()
  if (!email || !orderNumber) throw new Error('Store rating context is unavailable')
  return {
    id: id(raw.id),
    rating,
    status,
    comment: raw.comment?.trim() || null,
    adminResponse: raw.admin_response?.trim() || null,
    user: {
      id: id(raw.user.id),
      firstName: raw.user.first_name?.trim() ?? '',
      lastName: raw.user.last_name?.trim() || null,
      email,
    },
    order: { id: id(raw.order.id), orderNumber },
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export const storeRatingsService = {
  async list(
    page: number,
    signal?: AbortSignal,
    filters: StoreRatingsFilters = emptyStoreRatingsFilters
  ): Promise<PaginatedData<StoreRating>> {
    const response = (
      await $http.get<StoreRatingsIndexResponse>({
        url: '/dashboard/store-ratings',
        query: { ...serializeStoreRatingsFilters(filters), page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
    const items = response.data.map(normalizeStoreRating)
    return {
      items,
      paginate: {
        current_page: response.meta.current_page,
        total_pages: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total,
        count: items.length,
        next_page_url:
          response.meta.current_page < response.meta.last_page ? String(response.meta.current_page + 1) : null,
        prev_page_url: response.meta.current_page > 1 ? String(response.meta.current_page - 1) : null,
      },
      extra: null,
    }
  },
  async moderate(ratingId: number, status: ReviewModerationTarget): Promise<void> {
    if (!reviewModerationTargets.some((target) => target === status))
      throw new Error('Store rating moderation target is unavailable')
    await $http.patch<unknown>({
      url: `/dashboard/store-ratings/${id(ratingId)}`,
      data: { status },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  },
}
