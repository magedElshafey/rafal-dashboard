import { describe, expect, it } from 'vitest'

import {
  permissionsMockTransport,
  resetPermissionsMock,
  seedPermissionsMock,
} from '@/modules/roles/mocks/permissions.mock'

describe('permissions mock transport', () => {
  it('returns the documented permissions response contract', async () => {
    resetPermissionsMock()

    await expect(permissionsMockTransport.list(1)).resolves.toEqual({
      success: true,
      message: 'Permissions retrieved successfully',
      data: [
        { id: 2, name: 'manage admins' },
        { id: 1, name: 'manage banners' },
        { id: 3, name: 'manage roles' },
      ],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 3 },
    })
  })

  it('paginates additional permissions without duplicating pages', async () => {
    seedPermissionsMock(Array.from({ length: 16 }, (_, index) => ({ id: index + 1, name: `permission ${index + 1}` })))

    const firstPage = await permissionsMockTransport.list(1)
    const secondPage = await permissionsMockTransport.list(2)

    expect(firstPage.data).toHaveLength(15)
    expect(firstPage.meta).toEqual({ current_page: 1, last_page: 2, per_page: 15, total: 16 })
    expect(secondPage.data).toEqual([{ id: 16, name: 'permission 16' }])
    resetPermissionsMock()
  })
})
