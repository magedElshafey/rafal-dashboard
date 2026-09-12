import { describe, expect, it } from 'vitest'

import { rolesKeys } from '@/modules/roles/queries/roles.keys'

describe('roles query keys', () => {
  it('keeps list and detail caches under one feature key factory', () => {
    expect(rolesKeys.list()).toEqual(['roles', 'list', {}])
    expect(rolesKeys.detail(4)).toEqual(['roles', 'detail', 4])
  })
})
