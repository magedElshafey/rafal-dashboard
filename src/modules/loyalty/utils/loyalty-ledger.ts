import type { QueryRecord } from '@/store/queryContext/types'
import { isValidDateInput } from '@/utils/date/date.helpers'
import type { LoyaltyLedgerFilters } from '@/modules/loyalty/types/loyalty.types'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const emptyLoyaltyLedgerFilters: LoyaltyLedgerFilters = { type: null, from: '', to: '' }

export function readLoyaltyLedgerFilters(query: QueryRecord): LoyaltyLedgerFilters {
  return {
    type: query?.type === 'adjust_credit' ? 'adjust_credit' : null,
    from: query?.from ?? '',
    to: query?.to ?? '',
  }
}

export function getLoyaltyLedgerDateState(filters: LoyaltyLedgerFilters): 'valid' | 'incomplete' | 'invalid' {
  if (!filters.from && !filters.to) return 'valid'
  if (!filters.from || !filters.to) return 'incomplete'
  if (
    !DATE_PATTERN.test(filters.from) ||
    !DATE_PATTERN.test(filters.to) ||
    !isValidDateInput(filters.from) ||
    !isValidDateInput(filters.to) ||
    filters.from > filters.to
  ) {
    return 'invalid'
  }
  return 'valid'
}

export function serializeLoyaltyLedgerFilters(filters: LoyaltyLedgerFilters) {
  return {
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.from && filters.to ? { from: filters.from, to: filters.to } : {}),
  }
}
