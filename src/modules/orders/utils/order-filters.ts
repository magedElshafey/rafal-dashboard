import type { OrdersFilters } from '../types/order.types'
import { toApiBoolean } from '@/utils/api/serialize-api-boolean'

export const paymentFilterValues = ['paid', 'pending'] as const
export const orderFilterNames = [
  'status',
  'payment_status',
  'date_from',
  'date_to',
  'warehouse_id',
  'is_gift',
  'is_guest',
]
export const emptyOrdersFilters: OrdersFilters = {
  search: '',
  status: null,
  paymentStatus: null,
  dateFrom: '',
  dateTo: '',
  warehouseId: null,
  isGift: null,
  isGuest: null,
}
const triState = (value?: string) => (value === '1' ? true : value === '0' ? false : null)
export function readOrdersFilters(query: Record<string, string> | null): OrdersFilters {
  const warehouseId = Number(query?.warehouse_id)
  return {
    search: query?.search?.trim() ?? '',
    status: query?.status?.trim() || null,
    paymentStatus: query?.payment_status?.trim() || null,
    dateFrom: query?.date_from ?? '',
    dateTo: query?.date_to ?? '',
    warehouseId: Number.isSafeInteger(warehouseId) && warehouseId > 0 ? warehouseId : null,
    isGift: triState(query?.is_gift),
    isGuest: triState(query?.is_guest),
  }
}
function validDate(value: string) {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
export function validOrdersDateRange(filters: Pick<OrdersFilters, 'dateFrom' | 'dateTo'>) {
  return (
    validDate(filters.dateFrom) &&
    validDate(filters.dateTo) &&
    (!filters.dateFrom || !filters.dateTo || filters.dateFrom <= filters.dateTo)
  )
}
export function serializeOrdersFilters(filters: OrdersFilters) {
  if (!validOrdersDateRange(filters)) throw new Error('Invalid order date range')
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.paymentStatus ? { payment_status: filters.paymentStatus } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    ...(filters.warehouseId !== null ? { warehouse_id: filters.warehouseId } : {}),
    ...(filters.isGift !== null ? { is_gift: toApiBoolean(filters.isGift) } : {}),
    ...(filters.isGuest !== null ? { is_guest: toApiBoolean(filters.isGuest) } : {}),
  }
}
