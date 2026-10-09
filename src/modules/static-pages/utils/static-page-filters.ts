import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import type { PagesFilters, StaticPageSortBy, StaticPageSortDir } from '../types/static-page.types'

export const staticPageSortValues: StaticPageSortBy[] = ['created_at', 'slug']
export const staticPageSortDirections: StaticPageSortDir[] = ['asc', 'desc']
export const staticPageFilterNames = ['is_published', 'sort_by', 'sort_dir']

export const emptyPagesFilters: PagesFilters = {
  search: '',
  isPublished: null,
  sortBy: null,
  sortDir: null,
}

export function readPagesFilters(query: Record<string, string> | null): PagesFilters {
  const sortBy = query?.sort_by as StaticPageSortBy | undefined
  const sortDir = query?.sort_dir as StaticPageSortDir | undefined

  return {
    search: query?.search?.trim() ?? '',
    isPublished: query?.is_published === '1' ? true : query?.is_published === '0' ? false : null,
    sortBy: sortBy && staticPageSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && staticPageSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function serializePagesFilters(filters: PagesFilters) {
  const search = filters.search.trim()

  return {
    ...(search ? { search } : {}),
    ...(filters.isPublished !== null ? { is_published: toApiBoolean(filters.isPublished) } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
