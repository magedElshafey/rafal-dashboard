import { describe, expect, it } from 'vitest'

import { adminsKeys } from '@/modules/admins/queries/admins.keys'

describe('admins query keys', () => {
  it('separates lists and details inside the admins namespace', () => {
    expect(adminsKeys.list()).toEqual(['admins', 'list'])
    expect(adminsKeys.detail(7)).toEqual(['admins', 'detail', 7])
  })
})
