import { describe, expect, it } from 'vitest'

import { resetRolesMock, rolesMockTransport, seedRolesMock } from '@/modules/roles/mocks/roles.mock'

describe('roles mock transport', () => {
  it('preserves the documented pagination contract and supports later pages', async () => {
    seedRolesMock(
      Array.from({ length: 16 }, (_, index) => ({ id: index + 1, name: `Role ${index + 1}`, permissions: [] }))
    )

    const firstPage = await rolesMockTransport.list(1)
    const secondPage = await rolesMockTransport.list(2)

    expect(firstPage.data).toHaveLength(15)
    expect(firstPage.meta).toEqual({ current_page: 1, last_page: 2, per_page: 15, total: 16 })
    expect(secondPage.data.map((role) => role.name)).toEqual(['Role 16'])
    resetRolesMock()
  })

  it('mutates in-memory roles and deterministically rejects deleting the current account role', async () => {
    resetRolesMock()
    const created = await rolesMockTransport.create({ name: 'Auditor', permissions: ['manage roles'] })
    const updated = await rolesMockTransport.update(created.data.id, { name: 'Senior Auditor' })
    await rolesMockTransport.delete(created.data.id)

    expect(updated.data).toMatchObject({ name: 'Senior Auditor', permissions: [] })
    await expect(rolesMockTransport.show(created.data.id)).rejects.toMatchObject({ response: { status: 404 } })
    await expect(rolesMockTransport.delete(1)).rejects.toMatchObject({ response: { status: 403 } })
  })
})
