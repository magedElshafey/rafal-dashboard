import type { WarehousesFilters, WarehouseSortBy, WarehouseSortDir } from '../types/warehouse.types'

export const warehouseSortValues: WarehouseSortBy[] = ['id', 'name', 'created_at']
export const warehouseSortDirections: WarehouseSortDir[] = ['asc', 'desc']
export const warehouseFilterNames = ['city_id', 'created_from', 'created_to', 'sort_by', 'sort_dir']

export const emptyWarehousesFilters: WarehousesFilters = {
  cityId: null,
  createdFrom: '',
  createdTo: '',
  sortBy: null,
  sortDir: null,
}

const validDate = (value: string) => {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

const readCityId = (value?: string) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function readWarehousesFilters(query: Record<string, string> | null): WarehousesFilters {
  const sortBy = query?.sort_by as WarehouseSortBy | undefined
  const sortDir = query?.sort_dir as WarehouseSortDir | undefined
  return {
    cityId: readCityId(query?.city_id),
    createdFrom: query?.created_from ?? '',
    createdTo: query?.created_to ?? '',
    sortBy: sortBy && warehouseSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && warehouseSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function validWarehousesCreatedRange(filters: Pick<WarehousesFilters, 'createdFrom' | 'createdTo'>) {
  return (
    validDate(filters.createdFrom) &&
    validDate(filters.createdTo) &&
    (!filters.createdFrom || !filters.createdTo || filters.createdFrom <= filters.createdTo)
  )
}

export function serializeWarehousesFilters(filters: WarehousesFilters) {
  if (!validWarehousesCreatedRange(filters)) throw new Error('Invalid warehouse created date range')
  return {
    ...(filters.cityId !== null ? { city_id: filters.cityId } : {}),
    ...(filters.createdFrom ? { created_from: filters.createdFrom } : {}),
    ...(filters.createdTo ? { created_to: filters.createdTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
