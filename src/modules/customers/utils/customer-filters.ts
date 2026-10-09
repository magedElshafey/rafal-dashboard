import type { CustomersFilters, CustomerSortBy, CustomerSortDir } from '../types/customer.types'

export const customerSortValues: CustomerSortBy[] = ['created_at', 'name', 'email']
export const customerSortDirections: CustomerSortDir[] = ['asc', 'desc']
export const customerFilterNames = ['date_from', 'date_to', 'sort_by', 'sort_dir']

export const emptyCustomersFilters: CustomersFilters = {
  dateFrom: '',
  dateTo: '',
  sortBy: null,
  sortDir: null,
}

const validDate = (value: string) => {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function readCustomersFilters(query: Record<string, string> | null): CustomersFilters {
  const sortBy = query?.sort_by as CustomerSortBy | undefined
  const sortDir = query?.sort_dir as CustomerSortDir | undefined
  return {
    dateFrom: query?.date_from ?? '',
    dateTo: query?.date_to ?? '',
    sortBy: sortBy && customerSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && customerSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function validCustomersDateRange(filters: Pick<CustomersFilters, 'dateFrom' | 'dateTo'>) {
  return (
    validDate(filters.dateFrom) &&
    validDate(filters.dateTo) &&
    (!filters.dateFrom || !filters.dateTo || filters.dateFrom <= filters.dateTo)
  )
}

export function serializeCustomersFilters(filters: CustomersFilters) {
  if (!validCustomersDateRange(filters)) throw new Error('Invalid customer date range')
  return {
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
