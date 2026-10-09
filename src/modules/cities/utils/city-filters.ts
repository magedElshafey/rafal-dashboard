import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import type { CitiesFilters, CitySortBy, CitySortDir } from '../types/city.types'

export const citySortValues: CitySortBy[] = ['sort_order', 'name', 'created_at']
export const citySortDirections: CitySortDir[] = ['asc', 'desc']
export const cityFilterNames = ['is_active', 'sort_by', 'sort_dir']

export const emptyCitiesFilters: CitiesFilters = {
  isActive: null,
  sortBy: null,
  sortDir: null,
}

export function readCitiesFilters(query: Record<string, string> | null): CitiesFilters {
  const sortBy = query?.sort_by as CitySortBy | undefined
  const sortDir = query?.sort_dir as CitySortDir | undefined
  return {
    isActive: query?.is_active === '1' ? true : query?.is_active === '0' ? false : null,
    sortBy: sortBy && citySortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && citySortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function serializeCitiesFilters(filters: CitiesFilters) {
  return {
    ...(filters.isActive !== null ? { is_active: toApiBoolean(filters.isActive) } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
