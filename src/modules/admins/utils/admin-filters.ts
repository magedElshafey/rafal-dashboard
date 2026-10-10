import type { AdminsFilters, AdminSortBy, AdminSortDir } from '../types/admin.types'

export const adminSortValues: AdminSortBy[] = ['name', 'email', 'created_at']
export const adminSortDirections: AdminSortDir[] = ['asc', 'desc']
export const adminFilterNames = ['role', 'sort_by', 'sort_dir']

export const emptyAdminsFilters: AdminsFilters = {
  search: '',
  roleId: null,
  sortBy: null,
  sortDir: null,
}

const positiveId = (value?: string) => {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function readAdminsFilters(query: Record<string, string> | null): AdminsFilters {
  const sortBy = query?.sort_by as AdminSortBy | undefined
  const sortDir = query?.sort_dir as AdminSortDir | undefined
  return {
    search: query?.search?.trim() ?? '',
    roleId: positiveId(query?.role),
    sortBy: sortBy && adminSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && adminSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function serializeAdminsFilters(filters: AdminsFilters) {
  const search = filters.search.trim()
  return {
    ...(search ? { search } : {}),
    ...(filters.roleId ? { role: filters.roleId } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
