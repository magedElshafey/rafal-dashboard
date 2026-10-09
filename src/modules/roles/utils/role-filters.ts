import type { RolesFilters, RoleSortBy, RoleSortDir } from '../types/role.types'

export const roleSortValues: RoleSortBy[] = ['name', 'created_at']
export const roleSortDirections: RoleSortDir[] = ['asc', 'desc']
export const roleFilterNames = ['sort_by', 'sort_dir']

export const emptyRolesFilters: RolesFilters = {
  search: '',
  sortBy: null,
  sortDir: null,
}

export function readRolesFilters(query: Record<string, string> | null): RolesFilters {
  const sortBy = query?.sort_by as RoleSortBy | undefined
  const sortDir = query?.sort_dir as RoleSortDir | undefined
  return {
    search: query?.search?.trim() ?? '',
    sortBy: sortBy && roleSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && roleSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function serializeRolesFilters(filters: RolesFilters) {
  const search = filters.search.trim()
  return {
    ...(search ? { search } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
