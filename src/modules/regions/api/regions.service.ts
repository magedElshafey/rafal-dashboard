import env from '@/config/env'
import { regionsMockTransport } from '@/modules/regions/mocks/regions.mock'
import type {
  DeleteRegionResponse,
  RawRegion,
  RawRegionResponse,
  RegionPayload,
  RegionResponse,
  RegionsIndexResponse,
} from '@/modules/regions/types/region.types'
import { $http } from '@/utils/http'

export function serializeRegion(payload: RegionPayload) {
  const body = new FormData()
  body.set('name[ar]', payload.name.ar.trim())
  body.set('name[en]', payload.name.en.trim())
  const code = payload.code?.trim()
  if (code) body.set('code', code)
  if (payload.sortOrder !== undefined && payload.sortOrder !== null) {
    body.set('sort_order', String(payload.sortOrder))
  }
  body.set('is_active', payload.isActive ? '1' : '0')
  return body
}

function normalizeRegion(region: RawRegion) {
  return { ...region, name: { ...region.name }, cities_count: region.cities_count ?? 0 }
}

function normalizeResponse(response: RawRegionResponse): RegionResponse {
  return { ...response, data: normalizeRegion(response.data) }
}

const regionsHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    return (
      await $http.get<RegionsIndexResponse>({
        url: '/dashboard/regions',
        query: { page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
  },
  async create(payload: RegionPayload) {
    return (
      await $http.post<RawRegionResponse>({
        url: '/dashboard/regions',
        data: serializeRegion(payload),
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async update(id: number, payload: RegionPayload) {
    return (
      await $http.put<RawRegionResponse>({
        url: `/dashboard/regions/${id}`,
        data: serializeRegion(payload),
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async delete(id: number) {
    return (
      await $http.delete<DeleteRegionResponse>({
        url: `/dashboard/regions/${id}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}

const transport = env.REGIONS_USE_MOCK ? regionsMockTransport : regionsHttpTransport

export const regionsService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<ReturnType<typeof normalizeRegion>>> {
    const response = await transport.list(page, signal)
    const items = response.data.map(normalizeRegion)
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
  async create(payload: RegionPayload) {
    return normalizeResponse(await transport.create(payload))
  },
  async update(id: number, payload: RegionPayload) {
    return normalizeResponse(await transport.update(id, payload))
  },
  delete: (id: number) => transport.delete(id),
}
