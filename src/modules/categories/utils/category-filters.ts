import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import type { CategoriesFilters, CategorySortBy, CategorySortDir } from '../types/category.types'

export const categorySortValues: CategorySortBy[] = ['sort_order', 'name', 'created_at']
export const categorySortDirections: CategorySortDir[] = ['asc', 'desc']
export const categoryFilterNames = ['is_active', 'created_from', 'created_to', 'sort_by', 'sort_dir']

export const emptyCategoriesFilters: CategoriesFilters = {
  isActive: null,
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

export function readCategoriesFilters(query: Record<string, string> | null): CategoriesFilters {
  const sortBy = query?.sort_by as CategorySortBy | undefined
  const sortDir = query?.sort_dir as CategorySortDir | undefined
  return {
    isActive: query?.is_active === '1' ? true : query?.is_active === '0' ? false : null,
    createdFrom: query?.created_from ?? '',
    createdTo: query?.created_to ?? '',
    sortBy: sortBy && categorySortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && categorySortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function validCategoriesCreatedRange(filters: Pick<CategoriesFilters, 'createdFrom' | 'createdTo'>) {
  return (
    validDate(filters.createdFrom) &&
    validDate(filters.createdTo) &&
    (!filters.createdFrom || !filters.createdTo || filters.createdFrom <= filters.createdTo)
  )
}

export function serializeCategoriesFilters(filters: CategoriesFilters) {
  if (!validCategoriesCreatedRange(filters)) throw new Error('Invalid category created date range')
  return {
    ...(filters.isActive !== null ? { is_active: toApiBoolean(filters.isActive) } : {}),
    ...(filters.createdFrom ? { created_from: filters.createdFrom } : {}),
    ...(filters.createdTo ? { created_to: filters.createdTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
