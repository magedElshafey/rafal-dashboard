import type { Permission, PermissionsIndexResponse } from '@/modules/roles/types/permission.types'

const INITIAL_PERMISSIONS: readonly Permission[] = [
  { id: 2, name: 'manage admins' },
  { id: 1, name: 'manage banners' },
  { id: 3, name: 'manage roles' },
]

const MOCK_LATENCY_MS = 180
let permissions = INITIAL_PERMISSIONS.map((permission) => ({ ...permission }))

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

export const permissionsMockTransport = {
  async list(page: number, signal?: AbortSignal): Promise<PermissionsIndexResponse> {
    await delay(signal)
    const perPage = 15
    const currentPage = Math.max(1, page)
    const start = (currentPage - 1) * perPage

    return {
      success: true,
      message: 'Permissions retrieved successfully',
      data: permissions.slice(start, start + perPage).map((permission) => ({ ...permission })),
      meta: {
        current_page: currentPage,
        last_page: Math.max(1, Math.ceil(permissions.length / perPage)),
        per_page: perPage,
        total: permissions.length,
      },
    }
  },
}

export function resetPermissionsMock() {
  permissions = INITIAL_PERMISSIONS.map((permission) => ({ ...permission }))
}

export function seedPermissionsMock(nextPermissions: readonly Permission[]) {
  permissions = nextPermissions.map((permission) => ({ ...permission }))
}
