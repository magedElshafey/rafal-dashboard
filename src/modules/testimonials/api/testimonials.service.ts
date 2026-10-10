import type {
  DeleteTestimonialResponse,
  RawTestimonial,
  RawTestimonialResponse,
  Testimonial,
  TestimonialResponse,
  TestimonialsIndexResponse,
  TestimonialsFilters,
  TestimonialWritePayload,
  UpdateTestimonialResponse,
} from '@/modules/testimonials/types/testimonial.types'
import {
  emptyTestimonialsFilters,
  serializeTestimonialsFilters,
} from '@/modules/testimonials/utils/testimonial-filters'
import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import { $http } from '@/utils/http'

function normalizeNumber(value: number | string, field: string) {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) throw new Error(`Testimonial ${field} is unavailable`)
  return normalized
}

export function normalizeTestimonial(raw: RawTestimonial): Testimonial {
  return {
    id: raw.id,
    name: { ...raw.name },
    title: { ...raw.title },
    comment: { ...raw.comment },
    rating: normalizeNumber(raw.rating, 'rating'),
    sortOrder: normalizeNumber(raw.sort_order, 'sort order'),
    isPublished: Boolean(raw.is_published),
    avatarUrl: raw.avatar_url,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function serializeTestimonial(payload: TestimonialWritePayload) {
  const body = new FormData()
  body.set('name[ar]', payload.name.ar.trim())
  body.set('name[en]', payload.name.en.trim())
  body.set('title[ar]', payload.title.ar.trim())
  body.set('title[en]', payload.title.en.trim())
  body.set('comment[ar]', payload.comment.ar.trim())
  body.set('comment[en]', payload.comment.en.trim())
  body.set('rating', String(payload.rating))
  body.set('sort_order', String(payload.sortOrder))
  body.set('is_published', String(toApiBoolean(payload.isPublished)))
  if (payload.avatar) body.set('avatar', payload.avatar)
  return body
}

export const testimonialsService = {
  async list(
    page: number,
    signal?: AbortSignal,
    filters: TestimonialsFilters = emptyTestimonialsFilters
  ): Promise<PaginatedData<Testimonial>> {
    const response = (
      await $http.get<TestimonialsIndexResponse>({
        url: '/dashboard/testimonials',
        query: { ...serializeTestimonialsFilters(filters), page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
    const items = response.data.map(normalizeTestimonial)
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
  async create(payload: TestimonialWritePayload): Promise<TestimonialResponse> {
    const response = await $http.post<RawTestimonialResponse>({
      url: '/dashboard/testimonials',
      data: serializeTestimonial(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return { ...response.data, data: normalizeTestimonial(response.data.data) }
  },
  async update(id: number, payload: TestimonialWritePayload) {
    return (
      await $http.put<UpdateTestimonialResponse>({
        url: `/dashboard/testimonials/${id}`,
        data: serializeTestimonial(payload),
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async delete(id: number) {
    return (
      await $http.delete<DeleteTestimonialResponse>({
        url: `/dashboard/testimonials/${id}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}
