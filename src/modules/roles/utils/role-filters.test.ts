import { describe, expect, it } from 'vitest'
import { rolesKeys } from '../queries/roles.keys'
import {
  emptyRolesFilters,
  readRolesFilters,
  roleSortDirections,
  roleSortValues,
  serializeRolesFilters,
} from './role-filters'

describe('Roles server query filters', () => {
  it('trims and serializes search while omitting blank search', () => {
    expect(serializeRolesFilters({ ...emptyRolesFilters, search: '  manager  ' })).toEqual({ search: 'manager' })
    expect(serializeRolesFilters({ ...emptyRolesFilters, search: '   ' })).toEqual({})
  })

  it.each(roleSortValues)('serializes sort_by=%s', (sortBy) => {
    expect(serializeRolesFilters({ ...emptyRolesFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(roleSortDirections)('serializes sort_dir=%s', (sortDir) => {
    expect(serializeRolesFilters({ ...emptyRolesFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('ignores unsupported values and never introduces per_page', () => {
    expect(readRolesFilters({ sort_by: 'permissions', sort_dir: 'down', per_page: '50' })).toEqual(emptyRolesFilters)
    expect(serializeRolesFilters(emptyRolesFilters)).not.toHaveProperty('per_page')
  })

  it('includes search in query identity', () => {
    expect(rolesKeys.list({ ...emptyRolesFilters, search: 'manager' })).not.toEqual(rolesKeys.list())
  })
})
