import env from '@/config/env'
import { permissionsMockTransport } from '@/modules/roles/mocks/permissions.mock'
import type { Permission, PermissionsIndexResponse } from '@/modules/roles/types/permission.types'
import { $http } from '@/utils/http'

const permissionsHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    const response = await $http.get<PermissionsIndexResponse>({
      url: '/dashboard/permissions',
      query: { page },
      signal,
      suppressErrorNotification: true,
    })
    return response.data
  },
}

const transport = env.ROLES_USE_MOCK ? permissionsMockTransport : permissionsHttpTransport

export const permissionsService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<Permission>> {
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
}
