import { describe, expect, it } from 'vitest'

import { adminsKeys } from '@/modules/admins/queries/admins.keys'
import { emptyAdminsFilters, readAdminsFilters, serializeAdminsFilters } from '@/modules/admins/utils/admin-filters'

describe('admin filters', () => {
  it('trims search, accepts a positive role ID, and whitelists sorting', () => {
    const filters = readAdminsFilters({
      search: '  owner@example.com  ',
      role: '3',
      sort_by: 'email',
      sort_dir: 'desc',
    })

    expect(filters).toEqual({ search: 'owner@example.com', roleId: 3, sortBy: 'email', sortDir: 'desc' })
    expect(serializeAdminsFilters(filters)).toEqual({
      search: 'owner@example.com',
      role: 3,
      sort_by: 'email',
      sort_dir: 'desc',
    })
  })

  it.each(['0', '-1', '1.5', 'administrator', '', '9007199254740992'])('ignores invalid role value %j', (role) =>
    expect(readAdminsFilters({ role }).roleId).toBeNull()
  )

  it.each(['name', 'email', 'created_at'] as const)('accepts supported sort %s', (sortBy) => {
    expect(readAdminsFilters({ sort_by: sortBy }).sortBy).toBe(sortBy)
  })

  it.each(['asc', 'desc'] as const)('accepts direction %s', (sortDir) => {
    expect(readAdminsFilters({ sort_dir: sortDir }).sortDir).toBe(sortDir)
  })

  it('omits blank and inactive filters and rejects unsupported sorting', () => {
    const filters = readAdminsFilters({ search: '   ', role: '0', sort_by: 'role', sort_dir: 'sideways' })
    expect(filters).toEqual(emptyAdminsFilters)
    expect(serializeAdminsFilters(filters)).toEqual({})
  })

  it('serializes only the role ID contract, never role names, slugs, or per_page', () => {
    const serialized = serializeAdminsFilters({ ...emptyAdminsFilters, roleId: 4 })
    expect(serialized).toEqual({ role: 4 })
    expect(serialized).not.toHaveProperty('roleId')
    expect(serialized).not.toHaveProperty('role_name')
    expect(serialized).not.toHaveProperty('role_slug')
    expect(serialized).not.toHaveProperty('per_page')
  })

  it('includes filters in list query identity', () => {
    const filters = { ...emptyAdminsFilters, search: 'owner', roleId: 2 }
    expect(adminsKeys.list(filters)).toEqual(['admins', 'list', filters])
  })
})
