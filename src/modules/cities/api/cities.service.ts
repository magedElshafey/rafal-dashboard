import env from '@/config/env'
import { citiesMockTransport } from '@/modules/cities/mocks/cities.mock'
import type {
  City,
  CityCreateRequest,
  CityPayload,
  CityResponse,
  CityUpdatePayload,
  CitiesIndexResponse,
  DeleteCityResponse,
} from '@/modules/cities/types/city.types'
import { $http } from '@/utils/http'

function assertRequiredGeometry(
  payload: Pick<CityPayload, 'boundary' | 'center'>
): asserts payload is Pick<CityPayload, 'boundary'> & { center: NonNullable<CityPayload['center']> } {
  if (!payload.center) throw new Error('A City center is required')
  if (payload.boundary.length < 3) throw new Error('A completed City boundary is required')
  const coordinates = [...payload.boundary, payload.center]
  if (coordinates.some((point) => !Number.isFinite(point.lat) || !Number.isFinite(point.lng))) {
    throw new Error('City geometry contains an unfinished coordinate')
  }
}

export function serializeCity(payload: CityPayload): CityCreateRequest {
  if (payload.regionId === null) throw new Error('A region is required')
  assertRequiredGeometry(payload)
  return {
    region_id: payload.regionId,
    name: { ar: payload.name.ar.trim(), en: payload.name.en.trim() },
    is_active: payload.isActive,
    ...(payload.sortOrder === null ? {} : { sort_order: payload.sortOrder }),
    boundary: payload.boundary.map((point) => ({ ...point })),
    center: { ...payload.center },
  }
}

export function serializeCityUpdate(payload: CityUpdatePayload) {
  const body = new FormData()
  if (payload.regionId !== undefined) body.set('region_id', String(payload.regionId))
  if (payload.nameAr !== undefined) body.set('name[ar]', payload.nameAr.trim())
  if (payload.nameEn !== undefined) body.set('name[en]', payload.nameEn.trim())
  if (payload.isActive !== undefined) body.set('is_active', payload.isActive ? '1' : '0')
  if (payload.sortOrder !== undefined && payload.sortOrder !== null) body.set('sort_order', String(payload.sortOrder))
  if (payload.center !== undefined) {
    if (!Number.isFinite(payload.center.lat) || !Number.isFinite(payload.center.lng)) {
      throw new Error('City center contains an unfinished coordinate')
    }
    body.set('center[lat]', String(payload.center.lat))
    body.set('center[lng]', String(payload.center.lng))
  }
  if (payload.boundary !== undefined) {
    if (
      payload.boundary.length < 3 ||
      payload.boundary.some((point) => !Number.isFinite(point.lat) || !Number.isFinite(point.lng))
    ) {
      throw new Error('A completed City boundary is required')
    }
    payload.boundary.forEach((point, index) => {
      body.set(`boundary[${index}][lat]`, String(point.lat))
      body.set(`boundary[${index}][lng]`, String(point.lng))
    })
  }
  return body
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
  async update(id: number, payload: CityUpdatePayload) {
    return (
      await $http.put<CityResponse>({
        url: `/dashboard/cities/${id}`,
        data: serializeCityUpdate(payload),
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async delete(id: number) {
    return (
      await $http.delete<DeleteCityResponse>({
        url: `/dashboard/cities/${id}`,
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
    assertRequiredGeometry(payload)
    const response = await transport.create(payload)
    return { ...response, data: normalizeCity(response.data) }
  },
  async update(id: number, payload: CityUpdatePayload) {
    const response = await transport.update(id, payload)
    return { ...response, data: normalizeCity(response.data) }
  },
  delete: (id: number) => transport.delete(id),
}
