import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { permissionsService } from '@/modules/roles/api/permissions.service'

describe('permissions service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps the dashboard pagination response to shared infinite-query data', async () => {
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [
          { id: 2, name: 'manage admins' },
          { id: 1, name: 'manage banners' },
          { id: 3, name: 'manage roles' },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 3 },
      },
    })

    await expect(permissionsService.list(1)).resolves.toMatchObject({
      items: [
        { id: 2, name: 'manage admins' },
        { id: 1, name: 'manage banners' },
        { id: 3, name: 'manage roles' },
      ],
      paginate: { current_page: 1, total_pages: 1, per_page: 15, total: 3, count: 3 },
      extra: null,
    })
    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/permissions',
      query: { page: 1 },
      signal: undefined,
      suppressErrorNotification: true,
    })
  })
})
