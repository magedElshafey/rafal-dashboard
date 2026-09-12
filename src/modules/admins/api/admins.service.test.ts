import { describe, expect, it } from 'vitest'

import { serializeCreateAdmin, serializeUpdateAdmin } from '@/modules/admins/api/admins.service'

describe('admins service serialization', () => {
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
})
