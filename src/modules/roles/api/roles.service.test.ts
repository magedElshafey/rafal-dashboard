import { describe, expect, it } from 'vitest'

import { serializeRole } from '@/modules/roles/api/roles.service'

describe('roles service serialization', () => {
  it('keeps URL encoding at the transport boundary', () => {
    const body = serializeRole({ name: 'Content Manager', permissions: ['manage banners', 'manage roles'] })

    expect(body.get('name')).toBe('Content Manager')
    expect(body.getAll('permissions[]')).toEqual(['manage banners', 'manage roles'])
  })

  it('omits optional permissions when none are supplied', () => {
    expect(serializeRole({ name: 'Warehouse Staff' }).has('permissions[]')).toBe(false)
  })
})
