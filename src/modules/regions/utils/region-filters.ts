import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import type { RegionsFilters, RegionSortBy, RegionSortDir } from '../types/region.types'

export const regionSortValues: RegionSortBy[] = ['sort_order', 'name', 'code', 'created_at']
export const regionSortDirections: RegionSortDir[] = ['asc', 'desc']
export const regionFilterNames = ['is_active', 'sort_by', 'sort_dir']

export const emptyRegionsFilters: RegionsFilters = {
  isActive: null,
  sortBy: null,
  sortDir: null,
}

export function readRegionsFilters(query: Record<string, string> | null): RegionsFilters {
  const sortBy = query?.sort_by as RegionSortBy | undefined
  const sortDir = query?.sort_dir as RegionSortDir | undefined
  return {
    isActive: query?.is_active === '1' ? true : query?.is_active === '0' ? false : null,
    sortBy: sortBy && regionSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && regionSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function serializeRegionsFilters(filters: RegionsFilters) {
  return {
    ...(filters.isActive !== null ? { is_active: toApiBoolean(filters.isActive) } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
