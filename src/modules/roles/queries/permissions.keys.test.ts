import { describe, expect, it } from 'vitest'

import { permissionsKeys } from '@/modules/roles/queries/permissions.keys'

describe('permissions query keys', () => {
  it('keeps the paginated permissions list in its own stable namespace', () => {
    expect(permissionsKeys.list()).toEqual(['permissions', 'list'])
  })
})
