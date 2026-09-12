import env from '@/config/env'
import { adminsMockTransport } from '@/modules/admins/mocks/admins.mock'
import type {
  Admin,
  AdminResponse,
  AdminsIndexResponse,
  CreateAdminPayload,
  DeleteAdminResponse,
  UpdateAdminPayload,
} from '@/modules/admins/types/admin.types'
import { $http } from '@/utils/http'

function appendRoles(body: FormData, roles: readonly string[]) {
  roles.forEach((role) => body.append('roles[]', role))
}

export function serializeCreateAdmin(payload: CreateAdminPayload) {
  const body = new FormData()
  body.set('name', payload.name)
  body.set('email', payload.email)
  body.set('password', payload.password)
  body.set('password_confirmation', payload.passwordConfirmation)
  appendRoles(body, payload.roles)
  return body
}

export function serializeUpdateAdmin(payload: UpdateAdminPayload) {
  const body = new FormData()
  body.set('name', payload.name)
  body.set('email', payload.email)
  appendRoles(body, payload.roles)
  return body
}

const adminsHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    const response = await $http.get<AdminsIndexResponse>({
      url: '/dashboard/admins',
      query: { page },
      signal,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async show(id: number, signal?: AbortSignal) {
    const response = await $http.get<AdminResponse>({
      url: `/dashboard/admins/${id}`,
      signal,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async create(payload: CreateAdminPayload) {
    const response = await $http.post<AdminResponse>({
      url: '/dashboard/admins',
      data: serializeCreateAdmin(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async update(id: number, payload: UpdateAdminPayload) {
    const response = await $http.put<AdminResponse>({
      url: `/dashboard/admins/${id}`,
      data: serializeUpdateAdmin(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async delete(id: number) {
    const response = await $http.delete<DeleteAdminResponse>({
      url: `/dashboard/admins/${id}`,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    return response.data
  },
}

const transport = env.ADMINS_USE_MOCK ? adminsMockTransport : adminsHttpTransport

export const adminsService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<Admin>> {
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
  create: (payload: CreateAdminPayload) => transport.create(payload),
  update: (id: number, payload: UpdateAdminPayload) => transport.update(id, payload),
  delete: (id: number) => transport.delete(id),
}
