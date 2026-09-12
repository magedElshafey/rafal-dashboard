import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

import type {
  Admin,
  AdminResponse,
  AdminsIndexResponse,
  CreateAdminPayload,
  DeleteAdminResponse,
  UpdateAdminPayload,
} from '@/modules/admins/types/admin.types'

const INITIAL_ADMINS: readonly Admin[] = [
  { id: 1, name: 'Super Admin', email: 'admin@admin.com', roles: ['Super Admin'] },
  { id: 2, name: 'Test Admin', email: 'testadmin@test.com', roles: ['Super Admin'] },
  { id: 3, name: 'Test Admin', email: 'isolation-test-admin@test.com', roles: ['Super Admin'] },
]

const MOCK_LATENCY_MS = 180
const CURRENT_ACCOUNT_ADMIN_ID = 1
let admins = INITIAL_ADMINS.map(cloneAdmin)

function cloneAdmin(admin: Admin): Admin {
  return { ...admin, roles: [...admin.roles] }
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

export const adminsMockTransport = {
  async list(page: number, signal?: AbortSignal): Promise<AdminsIndexResponse> {
    await delay(signal)
    const perPage = 15
    const currentPage = Math.max(1, page)
    const start = (currentPage - 1) * perPage
    return {
      success: true,
      message: 'Admins retrieved successfully',
      data: admins.slice(start, start + perPage).map(cloneAdmin),
      meta: {
        current_page: currentPage,
        last_page: Math.max(1, Math.ceil(admins.length / perPage)),
        per_page: perPage,
        total: admins.length,
      },
    }
  },

  async show(id: number, signal?: AbortSignal): Promise<AdminResponse> {
    await delay(signal)
    const admin = admins.find((item) => item.id === id)
    if (!admin) throw mockAxiosError(404, 'Admin not found')
    return { success: true, message: 'Admin retrieved successfully', data: cloneAdmin(admin) }
  },

  async create(payload: CreateAdminPayload): Promise<AdminResponse> {
    await delay()
    const admin: Admin = {
      id: Math.max(0, ...admins.map((item) => item.id)) + 1,
      name: payload.name,
      email: payload.email,
      roles: [...payload.roles],
    }
    admins = [...admins, admin]
    return { success: true, message: 'Admin created successfully', data: cloneAdmin(admin) }
  },

  async update(id: number, payload: UpdateAdminPayload): Promise<AdminResponse> {
    await delay()
    if (!admins.some((item) => item.id === id)) throw mockAxiosError(404, 'Admin not found')
    const admin: Admin = { id, name: payload.name, email: payload.email, roles: [...payload.roles] }
    admins = admins.map((item) => (item.id === id ? admin : item))
    return { success: true, message: 'Admin updated successfully', data: cloneAdmin(admin) }
  },

  async delete(id: number): Promise<DeleteAdminResponse> {
    await delay()
    if (id === CURRENT_ACCOUNT_ADMIN_ID) throw mockAxiosError(403, 'You cannot delete your own account')
    if (!admins.some((item) => item.id === id)) throw mockAxiosError(404, 'Admin not found')
    admins = admins.filter((item) => item.id !== id)
    return { success: true, message: 'Admin deleted successfully' }
  },
}

export function resetAdminsMock() {
  admins = INITIAL_ADMINS.map(cloneAdmin)
}

export function seedAdminsMock(nextAdmins: readonly Admin[]) {
  admins = nextAdmins.map(cloneAdmin)
}
