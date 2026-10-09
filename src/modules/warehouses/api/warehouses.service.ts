import type {
  DeleteWarehouseResponse,
  RawWarehouseCreatePayload,
  RawWarehouseDetail,
  RawWarehouseListItem,
  RawWarehouseResponse,
  RawWarehouseUpdatePayload,
  WarehouseCreatePayload,
  WarehouseDetail,
  WarehouseListItem,
  WarehouseResponse,
  WarehousesIndexResponse,
  WarehouseUpdatePayload,
  WarehousesFilters,
} from '@/modules/warehouses/types/warehouse.types'
import { emptyWarehousesFilters, serializeWarehousesFilters } from '@/modules/warehouses/utils/warehouse-filters'
import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import { $http } from '@/utils/http'

function assertId(id: number, label: string) {
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`${label} is unavailable`)
  return id
}

export function normalizeWarehouseListItem(raw: RawWarehouseListItem): WarehouseListItem {
  return {
    id: assertId(raw.id, 'Warehouse ID'),
    name: raw.name,
    isActive: raw.is_active,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function normalizeWarehouseDetail(raw: RawWarehouseDetail): WarehouseDetail {
  if (!Array.isArray(raw.cities)) throw new Error('Warehouse cities are unavailable')
  return {
    ...normalizeWarehouseListItem(raw),
    cities: raw.cities.map((city) => ({
      id: assertId(city.id, 'City ID'),
      name: { ...city.name },
    })),
  }
}

function assertCityIds(cityIds: number[], required: boolean) {
  if (required && cityIds.length === 0) throw new Error('At least one City ID is required')
  cityIds.forEach((id) => assertId(id, 'City ID'))
}

export function serializeWarehouseCreate(payload: WarehouseCreatePayload): RawWarehouseCreatePayload {
  assertCityIds(payload.cityIds, true)
  return {
    name: payload.name.trim(),
    city_ids: [...payload.cityIds],
    is_active: toApiBoolean(payload.isActive),
  }
}

export function serializeWarehouseUpdate(payload: WarehouseUpdatePayload): RawWarehouseUpdatePayload {
  if (payload.cityIds !== undefined) assertCityIds(payload.cityIds, false)
  return {
    ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
    ...(payload.cityIds !== undefined ? { city_ids: [...payload.cityIds] } : {}),
    ...(payload.isActive !== undefined ? { is_active: toApiBoolean(payload.isActive) } : {}),
  }
}

function normalizeResponse(response: RawWarehouseResponse): WarehouseResponse {
  return { ...response, data: normalizeWarehouseDetail(response.data) }
}

export const warehousesService = {
  async list(
    page: number,
    signal?: AbortSignal,
    filters: WarehousesFilters = emptyWarehousesFilters
  ): Promise<PaginatedData<WarehouseListItem>> {
    const response = (
      await $http.get<WarehousesIndexResponse>({
        url: '/dashboard/warehouses',
        query: { ...serializeWarehousesFilters(filters), page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
    const items = response.data.map(normalizeWarehouseListItem)
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
    const response = await $http.get<RawWarehouseResponse>({
      url: `/dashboard/warehouses/${assertId(id, 'Warehouse ID')}`,
      signal,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data)
  },

  async create(payload: WarehouseCreatePayload) {
    const response = await $http.post<RawWarehouseResponse>({
      url: '/dashboard/warehouses',
      data: serializeWarehouseCreate(payload),
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data)
  },

  async update(id: number, payload: WarehouseUpdatePayload) {
    const response = await $http.put<RawWarehouseResponse>({
      url: `/dashboard/warehouses/${assertId(id, 'Warehouse ID')}`,
      data: serializeWarehouseUpdate(payload),
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data)
  },

  async delete(id: number) {
    return (
      await $http.delete<DeleteWarehouseResponse>({
        url: `/dashboard/warehouses/${assertId(id, 'Warehouse ID')}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}
