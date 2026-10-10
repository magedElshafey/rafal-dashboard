import type {
  RawReview,
  RawReviewResponse,
  ReviewListItem,
  ReviewModerationTarget,
  ReviewResponse,
  ReviewsIndexResponse,
  ReviewStatus,
  ReviewsFilters,
} from '@/modules/reviews/types/review.types'
import { emptyReviewsFilters, serializeReviewsFilters } from '@/modules/reviews/utils/review-filters'
import { $http } from '@/utils/http'

const reviewStatuses = new Set<ReviewStatus>(['pending', 'approved', 'rejected'])
const moderationTargets = new Set<ReviewModerationTarget>(['approved', 'rejected'])

function normalizeId(value: number, entity: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${entity} ID is unavailable`)
  return value
}

function normalizeRequiredString(value: string | null, field: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${field} is unavailable`)
  return normalized
}

function normalizeRating(value: number | string): number {
  const normalized = typeof value === 'number' ? value : Number(value.trim())
  if (!Number.isFinite(normalized) || normalized < 1 || normalized > 5) {
    throw new Error('Review rating is unavailable')
  }
  return normalized
}

function normalizeCount(value: number | string, field: string): number {
  const normalized = typeof value === 'number' ? value : Number(value.trim())
  if (!Number.isSafeInteger(normalized) || normalized < 0) throw new Error(`${field} is unavailable`)
  return normalized
}

function normalizeStatus(value: string): ReviewStatus {
  if (!reviewStatuses.has(value as ReviewStatus)) throw new Error('Review status is unavailable')
  return value as ReviewStatus
}

export function normalizeReview(raw: RawReview): ReviewListItem {
  if (!raw.user) throw new Error('Review user is unavailable')
  if (!raw.product) throw new Error('Review product is unavailable')

  return {
    id: normalizeId(raw.id, 'Review'),
    rating: normalizeRating(raw.rating),
    comment: normalizeRequiredString(raw.comment, 'Review comment'),
    status: normalizeStatus(raw.status),
    adminResponse: raw.admin_response,
    helpfulCount: normalizeCount(raw.helpful_count, 'Review helpful count'),
    reportsCount: normalizeCount(raw.reports_count, 'Review reports count'),
    reviewer: {
      id: normalizeId(raw.user.id, 'User'),
      firstName: normalizeRequiredString(raw.user.first_name, 'Review user first name'),
      lastName: raw.user.last_name?.trim() || null,
      email: normalizeRequiredString(raw.user.email, 'Review user email'),
    },
    product: {
      id: normalizeId(raw.product.id, 'Product'),
      name: normalizeRequiredString(raw.product.name, 'Review product name'),
      slug: raw.product.slug?.trim() || null,
    },
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function normalizeResponse(response: RawReviewResponse): ReviewResponse {
  return { ...response, data: normalizeReview(response.data) }
}

export const reviewsService = {
  async list(
    page: number,
    signal?: AbortSignal,
    filters: ReviewsFilters = emptyReviewsFilters
  ): Promise<PaginatedData<ReviewListItem>> {
    const response = (
      await $http.get<ReviewsIndexResponse>({
        url: '/dashboard/reviews',
        query: { ...serializeReviewsFilters(filters), page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
    const items = response.data.map(normalizeReview)
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

  async moderate(id: number, status: ReviewModerationTarget): Promise<ReviewResponse> {
    if (!moderationTargets.has(status)) throw new Error('Review moderation target is unavailable')
    const response = await $http.patch<RawReviewResponse>({
      url: `/dashboard/reviews/${id}`,
      data: { status },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data)
  },
}
