import env from '@/config/env'
import { rolesMockTransport } from '@/modules/roles/mocks/roles.mock'
import type {
  CreateRolePayload,
  DeleteRoleResponse,
  Role,
  RoleResponse,
  RolesIndexResponse,
  UpdateRolePayload,
} from '@/modules/roles/types/role.types'
import { $http } from '@/utils/http'

function serializeRole(payload: CreateRolePayload | UpdateRolePayload) {
  const body = new URLSearchParams()
  body.set('name', payload.name)
  payload.permissions?.forEach((permission) => body.append('permissions[]', permission))
  return body
}

const rolesHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    const response = await $http.get<RolesIndexResponse>({
      url: '/dashboard/roles',
      query: { page },
      signal,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async show(id: number, signal?: AbortSignal) {
    const response = await $http.get<RoleResponse>({
      url: `/dashboard/roles/${id}`,
      signal,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async create(payload: CreateRolePayload) {
    const response = await $http.post<RoleResponse>({
      url: '/dashboard/roles',
      data: serializeRole(payload),
      isFormUrlEncoded: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async update(id: number, payload: UpdateRolePayload) {
    const response = await $http.put<RoleResponse>({
      url: `/dashboard/roles/${id}`,
      data: serializeRole(payload),
      isFormUrlEncoded: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async delete(id: number) {
    const response = await $http.delete<DeleteRoleResponse>({
      url: `/dashboard/roles/${id}`,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    return response.data
  },
}

const transport = env.ROLES_USE_MOCK ? rolesMockTransport : rolesHttpTransport

export const rolesService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<Role>> {
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
  create: (payload: CreateRolePayload) => transport.create(payload),
  update: (id: number, payload: UpdateRolePayload) => transport.update(id, payload),
  delete: (id: number) => transport.delete(id),
}

export { serializeRole }
