import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { adminsService, serializeCreateAdmin, serializeUpdateAdmin } from '@/modules/admins/api/admins.service'

describe('admins service serialization', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps create fields to the documented multipart contract', () => {
    const body = serializeCreateAdmin({
      name: 'Test Admin',
      email: 'test@example.com',
      password: 'secret',
      passwordConfirmation: 'secret',
      roles: ['Super Admin', 'Content Manager'],
    })

    expect(body.get('name')).toBe('Test Admin')
    expect(body.get('email')).toBe('test@example.com')
    expect(body.get('password')).toBe('secret')
    expect(body.get('password_confirmation')).toBe('secret')
    expect(body.getAll('roles[]')).toEqual(['Super Admin', 'Content Manager'])
  })

  it('serializes only confirmed update fields and excludes password data', () => {
    const body = serializeUpdateAdmin({ name: 'Updated', email: 'updated@example.com', roles: ['Super Admin'] })

    expect(Array.from(body.keys())).toEqual(['name', 'email', 'roles[]'])
    expect(body.has('password')).toBe(false)
    expect(body.has('password_confirmation')).toBe(false)
  })

  it('calls only the real Admin endpoints through shared HTTP', async () => {
    const admin = { id: 7, name: 'Test Admin', email: 'test@example.com', roles: ['Super Admin'] }
    const listResponse = {
      success: true,
      message: 'ok',
      data: [admin],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
    }
    const itemResponse = { success: true, message: 'ok', data: admin }
    httpMocks.get.mockResolvedValueOnce({ data: listResponse }).mockResolvedValueOnce({ data: itemResponse })
    httpMocks.post.mockResolvedValue({ data: itemResponse })
    httpMocks.put.mockResolvedValue({ data: itemResponse })
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
    const createPayload = {
      name: admin.name,
      email: admin.email,
      password: 'secret',
      passwordConfirmation: 'secret',
      roles: admin.roles,
    }
    const updatePayload = { name: admin.name, email: admin.email, roles: admin.roles }

    await expect(adminsService.list(1)).resolves.toMatchObject({ items: [admin], paginate: { total: 1 } })
    await adminsService.show(7)
    await adminsService.create(createPayload)
    await adminsService.update(7, updatePayload)
    await adminsService.delete(7)

    expect(httpMocks.get).toHaveBeenNthCalledWith(1, {
      url: '/dashboard/admins',
      query: { page: 1 },
      signal: undefined,
      suppressErrorNotification: true,
    })
    expect(httpMocks.get).toHaveBeenNthCalledWith(2, {
      url: '/dashboard/admins/7',
      signal: undefined,
      suppressErrorNotification: true,
    })
    expect(httpMocks.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/admins', data: expect.any(FormData), isFormData: true })
    )
    expect(httpMocks.put).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/admins/7', data: expect.any(FormData), isFormData: true })
    )
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/admins/7',
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
  })
})
