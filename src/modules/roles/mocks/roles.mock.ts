import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

import type {
  CreateRolePayload,
  DeleteRoleResponse,
  Role,
  RoleResponse,
  RolesIndexResponse,
  UpdateRolePayload,
} from '@/modules/roles/types/role.types'

const INITIAL_ROLES: readonly Role[] = [
  { id: 2, name: 'Content Manager', permissions: ['manage banners'] },
  { id: 4, name: 'Marketing Manager', permissions: [] },
  { id: 3, name: 'Order Manager', permissions: [] },
  { id: 1, name: 'Super Admin', permissions: ['manage banners', 'manage admins', 'manage roles'] },
  { id: 5, name: 'Warehouse Staff', permissions: [] },
]

const MOCK_LATENCY_MS = 180
const CURRENT_ACCOUNT_ROLE_ID = 1
let roles = INITIAL_ROLES.map(cloneRole)

function cloneRole(role: Role): Role {
  return { ...role, permissions: [...role.permissions] }
}

function delay(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, MOCK_LATENCY_MS)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('The operation was aborted.', 'AbortError'))
      },
      { once: true }
    )
  })
}

function mockAxiosError(status: number, message: string) {
  const config = { headers: {} } as InternalAxiosRequestConfig
  const response: AxiosResponse = {
    status,
    statusText: String(status),
    headers: {},
    config,
    data: { success: false, message },
  }
  return new AxiosError(message, undefined, config, undefined, response)
}

export const rolesMockTransport = {
  async list(page: number, signal?: AbortSignal): Promise<RolesIndexResponse> {
    await delay(signal)
    const perPage = 15
    const currentPage = Math.max(1, page)
    const start = (currentPage - 1) * perPage
    return {
      success: true,
      message: 'Roles retrieved successfully',
      data: roles.slice(start, start + perPage).map(cloneRole),
      meta: {
        current_page: currentPage,
        last_page: Math.max(1, Math.ceil(roles.length / perPage)),
        per_page: perPage,
        total: roles.length,
      },
    }
  },

  async show(id: number, signal?: AbortSignal): Promise<RoleResponse> {
    await delay(signal)
    const role = roles.find((item) => item.id === id)
    if (!role) throw mockAxiosError(404, 'Role not found')
    return { success: true, message: 'Role retrieved successfully', data: cloneRole(role) }
  },

  async create(payload: CreateRolePayload): Promise<RoleResponse> {
    await delay()
    const role: Role = {
      id: Math.max(0, ...roles.map((item) => item.id)) + 1,
      name: payload.name,
      permissions: [...(payload.permissions ?? [])],
    }
    roles = [...roles, role]
    return { success: true, message: 'Role created successfully', data: cloneRole(role) }
  },

  async update(id: number, payload: UpdateRolePayload): Promise<RoleResponse> {
    await delay()
    const index = roles.findIndex((item) => item.id === id)
    if (index < 0) throw mockAxiosError(404, 'Role not found')
    const role = { id, name: payload.name, permissions: [...(payload.permissions ?? [])] }
    roles = roles.map((item) => (item.id === id ? role : item))
    return { success: true, message: 'Role updated successfully', data: cloneRole(role) }
  },

  async delete(id: number): Promise<DeleteRoleResponse> {
    await delay()
    if (id === CURRENT_ACCOUNT_ROLE_ID) {
      throw mockAxiosError(403, 'You cannot delete a role assigned to your own account')
    }
    if (!roles.some((item) => item.id === id)) throw mockAxiosError(404, 'Role not found')
    roles = roles.filter((item) => item.id !== id)
    return { success: true, message: 'Role deleted successfully' }
  },
}

export function resetRolesMock() {
  roles = INITIAL_ROLES.map(cloneRole)
}

export function seedRolesMock(nextRoles: readonly Role[]) {
  roles = nextRoles.map(cloneRole)
}
