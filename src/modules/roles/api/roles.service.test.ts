import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { rolesService, serializeRole } from '@/modules/roles/api/roles.service'

describe('roles service serialization', () => {
  beforeEach(() => vi.clearAllMocks())

  it('keeps URL encoding at the transport boundary', () => {
    const body = serializeRole({ name: 'Content Manager', permissions: ['manage banners', 'manage roles'] })

    expect(body.get('name')).toBe('Content Manager')
    expect(body.getAll('permissions[]')).toEqual(['manage banners', 'manage roles'])
  })

  it('omits optional permissions when none are supplied', () => {
    expect(serializeRole({ name: 'Warehouse Staff' }).has('permissions[]')).toBe(false)
  })

  it('calls only the real Role endpoints through shared HTTP', async () => {
    const role = { id: 2, name: 'Content Manager', permissions: ['manage banners'] }
    const listResponse = {
      success: true,
      message: 'ok',
      data: [role],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    }
    const itemResponse = { success: true, message: 'ok', data: role }
    httpMocks.get.mockResolvedValueOnce({ data: listResponse }).mockResolvedValueOnce({ data: itemResponse })
    httpMocks.post.mockResolvedValue({ data: itemResponse })
    httpMocks.put.mockResolvedValue({ data: itemResponse })
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
    const payload = { name: role.name, permissions: role.permissions }

    await expect(rolesService.list(1)).resolves.toMatchObject({ items: [role], paginate: { total: 1 } })
    await rolesService.show(2)
    await rolesService.create(payload)
    await rolesService.update(2, payload)
    await rolesService.delete(2)

    expect(httpMocks.get).toHaveBeenNthCalledWith(1, {
      url: '/dashboard/roles',
      query: { page: 1 },
      signal: undefined,
      suppressErrorNotification: true,
    })
    expect(httpMocks.get).toHaveBeenNthCalledWith(2, {
      url: '/dashboard/roles/2',
      signal: undefined,
      suppressErrorNotification: true,
    })
    expect(httpMocks.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/roles', data: expect.any(URLSearchParams), isFormUrlEncoded: true })
    )
    expect(httpMocks.put).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/roles/2', data: expect.any(URLSearchParams), isFormUrlEncoded: true })
    )
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/roles/2',
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
  })
})
