import type { ReturnRequestsFilters, ReturnRequestSortBy, ReturnRequestSortDir } from '../types/return-request.types'

export const returnRequestSortValues: ReturnRequestSortBy[] = ['created_at', 'status']
export const returnRequestSortDirections: ReturnRequestSortDir[] = ['asc', 'desc']
export const returnRequestFilterNames = ['order_id', 'date_from', 'date_to', 'sort_by', 'sort_dir']

export const emptyReturnRequestsFilters: ReturnRequestsFilters = {
  orderId: null,
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

const readOrderId = (value?: string) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function readReturnRequestsFilters(query: Record<string, string> | null): ReturnRequestsFilters {
  const sortBy = query?.sort_by as ReturnRequestSortBy | undefined
  const sortDir = query?.sort_dir as ReturnRequestSortDir | undefined
  return {
    orderId: readOrderId(query?.order_id),
    dateFrom: query?.date_from ?? '',
    dateTo: query?.date_to ?? '',
    sortBy: sortBy && returnRequestSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && returnRequestSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function validReturnRequestsDateRange(filters: Pick<ReturnRequestsFilters, 'dateFrom' | 'dateTo'>) {
  return (
    validDate(filters.dateFrom) &&
    validDate(filters.dateTo) &&
    (!filters.dateFrom || !filters.dateTo || filters.dateFrom <= filters.dateTo)
  )
}

export function serializeReturnRequestsFilters(filters: ReturnRequestsFilters) {
  if (!validReturnRequestsDateRange(filters)) throw new Error('Invalid return request date range')
  const validOrderId = Number.isSafeInteger(filters.orderId) && Number(filters.orderId) > 0
  return {
    ...(validOrderId ? { order_id: filters.orderId } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
