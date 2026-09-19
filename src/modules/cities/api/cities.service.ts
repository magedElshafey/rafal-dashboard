import env from '@/config/env'
import { citiesMockTransport } from '@/modules/cities/mocks/cities.mock'
import type {
  City,
  CityCreateRequest,
  CityPayload,
  CityResponse,
  CitiesIndexResponse,
} from '@/modules/cities/types/city.types'
import { $http } from '@/utils/http'

export function serializeCity(payload: CityPayload): CityCreateRequest {
  if (payload.regionId === null) throw new Error('A region is required')
  return {
    region_id: payload.regionId,
    name: { ar: payload.name.ar.trim(), en: payload.name.en.trim() },
    is_active: payload.isActive,
    ...(payload.sortOrder === null ? {} : { sort_order: payload.sortOrder }),
    boundary: payload.boundary.length > 0 ? payload.boundary.map((point) => ({ ...point })) : null,
    center: payload.center ? { ...payload.center } : null,
  }
}

function normalizeCity(city: City): City {
  return {
    id: city.id,
    region_id: city.region_id,
    region: { id: city.region.id, name: { ...city.region.name } },
    name: { ...city.name },
    boundary: city.boundary?.map((point) => ({ ...point })) ?? null,
    center: city.center ? { ...city.center } : null,
    is_active: city.is_active,
    sort_order: city.sort_order,
    created_at: city.created_at,
    updated_at: city.updated_at,
  }
}

const citiesHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    return (
      await $http.get<CitiesIndexResponse>({
        url: '/dashboard/cities',
        query: { page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
  },
  async create(payload: CityPayload) {
    return (
      await $http.post<CityResponse>({
        url: '/dashboard/cities',
        data: serializeCity(payload),
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}

const transport = env.CITIES_USE_MOCK ? citiesMockTransport : citiesHttpTransport

export const citiesService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<City>> {
    const response = await transport.list(page, signal)
    const items = response.data.map(normalizeCity)
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
  async create(payload: CityPayload) {
    const response = await transport.create(payload)
    return { ...response, data: normalizeCity(response.data) }
  },
}
