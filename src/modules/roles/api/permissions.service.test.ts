import { describe, expect, it } from 'vitest'

import { permissionsService } from '@/modules/roles/api/permissions.service'
import { resetPermissionsMock } from '@/modules/roles/mocks/permissions.mock'

describe('permissions service', () => {
  it('maps the dashboard pagination response to shared infinite-query data', async () => {
    resetPermissionsMock()

    await expect(permissionsService.list(1)).resolves.toMatchObject({
      items: [
        { id: 2, name: 'manage admins' },
        { id: 1, name: 'manage banners' },
        { id: 3, name: 'manage roles' },
      ],
      paginate: { current_page: 1, total_pages: 1, per_page: 15, total: 3, count: 3 },
      extra: null,
    })
  })
})
