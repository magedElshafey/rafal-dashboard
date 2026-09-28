import { parseDate } from '@/utils/date/date.helpers'

const FORM_DATETIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
const API_RESPONSE_DATETIME_PATTERN =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/
const LEGACY_API_DATETIME_PATTERN = /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2})$/

/**
 * Coupon datetime conversion is intentionally isolated here. The backend's
 * canonical timezone semantics are still pending. Writes use a wall-clock
 * format while reads are offset-aware; both conversions deliberately preserve
 * the supplied calendar/clock components without UTC or regional conversion.
 */
export function toCouponApiDateTime(value: string): string | null {
  const normalized = value.trim()
  if (!normalized) return null
  const match = normalized.match(FORM_DATETIME_PATTERN)
  if (!match || !parseDate(normalized)) throw new RangeError('Cannot serialize an invalid Coupon datetime.')
  const [, date, hours, minutes, seconds = '00'] = match
  return `${date} ${hours}:${minutes}:${seconds}`
}

export function toCouponDateTimeInput(value: string | null): string {
  const normalized = value?.trim() ?? ''
  if (!normalized) return ''
  const match = normalized.match(API_RESPONSE_DATETIME_PATTERN) ?? normalized.match(LEGACY_API_DATETIME_PATTERN)
  if (!match) return ''
  const [, date, hours, minutes, seconds] = match
  if (!parseDate(`${date}T${hours}:${minutes}:${seconds}`)) return ''
  return `${date}T${hours}:${minutes}`
}

export function isCouponDateRangeOrdered(startsAt: string, endsAt: string): boolean {
  if (!startsAt || !endsAt) return true
  const start = parseDate(startsAt)
  const end = parseDate(endsAt)
  return Boolean(start && end && start.getTime() <= end.getTime())
}
