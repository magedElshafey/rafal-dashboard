import { describe, expect, it } from 'vitest'

import { adminsMockTransport, resetAdminsMock, seedAdminsMock } from '@/modules/admins/mocks/admins.mock'

describe('admins mock transport', () => {
  it('preserves the documented response and paginates later pages', async () => {
    resetAdminsMock()
    await expect(adminsMockTransport.list(1)).resolves.toMatchObject({
      success: true,
      message: 'Admins retrieved successfully',
      data: [
        { id: 1, name: 'Super Admin', email: 'admin@admin.com', roles: ['Super Admin'] },
        { id: 2, name: 'Test Admin', email: 'testadmin@test.com', roles: ['Super Admin'] },
        { id: 3, name: 'Test Admin', email: 'isolation-test-admin@test.com', roles: ['Super Admin'] },
      ],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 3 },
    })

    seedAdminsMock(
      Array.from({ length: 16 }, (_, index) => ({
        id: index + 1,
        name: `Admin ${index + 1}`,
        email: `admin${index + 1}@example.com`,
        roles: [],
      }))
    )
    expect((await adminsMockTransport.list(2)).data.map((admin) => admin.name)).toEqual(['Admin 16'])
    resetAdminsMock()
  })

  it('mutates without retaining passwords and deterministically rejects self deletion', async () => {
    resetAdminsMock()
    const created = await adminsMockTransport.create({
      name: 'Auditor',
      email: 'auditor@example.com',
      password: 'secret',
      passwordConfirmation: 'secret',
      roles: ['Content Manager'],
    })
    const updated = await adminsMockTransport.update(created.data.id, {
      name: 'Senior Auditor',
      email: 'senior@example.com',
      roles: [],
    })

    expect(created.data).not.toHaveProperty('password')
    expect(updated.data).toEqual({
      id: created.data.id,
      name: 'Senior Auditor',
      email: 'senior@example.com',
      roles: [],
    })
    await adminsMockTransport.delete(created.data.id)
    await expect(adminsMockTransport.show(created.data.id)).rejects.toMatchObject({ response: { status: 404 } })
    await expect(adminsMockTransport.delete(1)).rejects.toMatchObject({ response: { status: 403 } })
  })
})
