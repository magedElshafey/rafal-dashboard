import env from '@/config/env'
import { normalizeCategory } from '@/modules/categories/api/category.mapper'
import { categoriesMockTransport } from '@/modules/categories/mocks/categories.mock'
import type {
  Category,
  CategoryPayload,
  CategoryResponse,
  DeleteCategoryResponse,
  RawCategoriesIndexResponse,
  RawCategoryResponse,
} from '@/modules/categories/types/category.types'
import { $http } from '@/utils/http'

function normalizeResponse(response: RawCategoryResponse): CategoryResponse {
  return { ...response, data: normalizeCategory(response.data) }
}

export function serializeCategory(payload: CategoryPayload) {
  const body = new FormData()
  body.set('name[ar]', payload.name.ar)
  body.set('name[en]', payload.name.en)
  body.set('slug', payload.slug)
  body.set('is_active', payload.is_active ? '1' : '0')
  body.set('sort_order', String(payload.sort_order))
  body.set('parent_id', payload.parent_id === null ? '' : String(payload.parent_id))
  if (payload.description) {
    body.set('description[ar]', payload.description.ar)
    body.set('description[en]', payload.description.en)
  }
  return body
}

const categoriesHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    const response = await $http.get<RawCategoriesIndexResponse>({
      url: '/dashboard/categories',
      query: { page },
      signal,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async show(id: number, signal?: AbortSignal) {
    const response = await $http.get<RawCategoryResponse>({
      url: `/dashboard/categories/${id}`,
      signal,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async create(payload: CategoryPayload) {
    const response = await $http.post<RawCategoryResponse>({
      url: '/dashboard/categories',
      data: serializeCategory(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async update(id: number, payload: CategoryPayload) {
    const response = await $http.put<RawCategoryResponse>({
      url: `/dashboard/categories/${id}`,
      data: serializeCategory(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async delete(id: number) {
    const response = await $http.delete<DeleteCategoryResponse>({
      url: `/dashboard/categories/${id}`,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
}

const transport = env.CATEGORIES_USE_MOCK ? categoriesMockTransport : categoriesHttpTransport

export const categoriesService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<Category>> {
    const response = await transport.list(page, signal)
    const items = response.data.map(normalizeCategory)
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
  async show(id: number, signal?: AbortSignal) {
    return normalizeResponse(await transport.show(id, signal))
  },
  async create(payload: CategoryPayload) {
    return normalizeResponse(await transport.create(payload))
  },
  async update(id: number, payload: CategoryPayload) {
    return normalizeResponse(await transport.update(id, payload))
  },
  delete: (id: number) => transport.delete(id),
}
