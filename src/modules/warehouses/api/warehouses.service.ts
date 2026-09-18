import env from '@/config/env'
import { warehousesMockTransport } from '@/modules/warehouses/mocks/warehouses.mock'
import type {
  DeleteWarehouseResponse,
  WarehousePayload,
  WarehouseResponse,
  WarehousesIndexResponse,
} from '@/modules/warehouses/types/warehouse.types'
import { $http } from '@/utils/http'

export function serializeWarehouse(payload: WarehousePayload) {
  const body = new FormData()
  body.set('name', payload.name.trim())
  payload.coverageZone.forEach((zone) => body.append('coverage_zone[]', zone.trim()))
  body.set('is_active', payload.isActive ? '1' : '0')
  return body
}

const warehousesHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    return (
      await $http.get<WarehousesIndexResponse>({
        url: '/dashboard/warehouses',
        query: { page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
  },
  async show(id: number, signal?: AbortSignal) {
    return (
      await $http.get<WarehouseResponse>({
        url: `/dashboard/warehouses/${id}`,
        signal,
        suppressErrorNotification: true,
      })
    ).data
  },
  async create(payload: WarehousePayload) {
    return (
      await $http.post<WarehouseResponse>({
        url: '/dashboard/warehouses',
        data: serializeWarehouse(payload),
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async update(id: number, payload: WarehousePayload) {
    return (
      await $http.put<WarehouseResponse>({
        url: `/dashboard/warehouses/${id}`,
        data: serializeWarehouse(payload),
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async delete(id: number) {
    return (
      await $http.delete<DeleteWarehouseResponse>({
        url: `/dashboard/warehouses/${id}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}

const transport = env.WAREHOUSES_USE_MOCK ? warehousesMockTransport : warehousesHttpTransport

export const warehousesService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<import('../types/warehouse.types').Warehouse>> {
    const response = await transport.list(page, signal)
    return {
      items: response.data,
      paginate: {
        current_page: response.meta.current_page,
        total_pages: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total,
        count: response.data.length,
        next_page_url:
          response.meta.current_page < response.meta.last_page ? String(response.meta.current_page + 1) : null,
        prev_page_url: response.meta.current_page > 1 ? String(response.meta.current_page - 1) : null,
      },
      extra: null,
    }
  },
  show: (id: number, signal?: AbortSignal) => transport.show(id, signal),
  create: (payload: WarehousePayload) => transport.create(payload),
  update: (id: number, payload: WarehousePayload) => transport.update(id, payload),
  delete: (id: number) => transport.delete(id),
}
