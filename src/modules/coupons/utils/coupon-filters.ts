import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import type { CouponsFilters, CouponSortBy, CouponSortDir, CouponType } from '../types/coupon.types'

export const couponTypeValues: CouponType[] = ['percent', 'fixed']
export const couponSortValues: CouponSortBy[] = ['created_at', 'code', 'type', 'is_active']
export const couponSortDirections: CouponSortDir[] = ['asc', 'desc']
export const couponFilterNames = ['type', 'is_currently_valid', 'date_from', 'date_to', 'sort_by', 'sort_dir']

export const emptyCouponsFilters: CouponsFilters = {
  type: null,
  isCurrentlyValid: null,
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

export function readCouponsFilters(query: Record<string, string> | null): CouponsFilters {
  const type = query?.type as CouponType | undefined
  const sortBy = query?.sort_by as CouponSortBy | undefined
  const sortDir = query?.sort_dir as CouponSortDir | undefined
  return {
    type: type && couponTypeValues.includes(type) ? type : null,
    isCurrentlyValid: query?.is_currently_valid === '1' ? true : query?.is_currently_valid === '0' ? false : null,
    dateFrom: query?.date_from ?? '',
    dateTo: query?.date_to ?? '',
    sortBy: sortBy && couponSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && couponSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function validCouponsDateRange(filters: Pick<CouponsFilters, 'dateFrom' | 'dateTo'>) {
  return (
    validDate(filters.dateFrom) &&
    validDate(filters.dateTo) &&
    (!filters.dateFrom || !filters.dateTo || filters.dateFrom <= filters.dateTo)
  )
}

export function serializeCouponsFilters(filters: CouponsFilters) {
  if (!validCouponsDateRange(filters)) throw new Error('Invalid coupon date range')
  return {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.isCurrentlyValid !== null ? { is_currently_valid: toApiBoolean(filters.isCurrentlyValid) } : {}),
    ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
    ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
