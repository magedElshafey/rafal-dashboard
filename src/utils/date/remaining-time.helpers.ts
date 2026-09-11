import type { TFunction } from 'i18next'
import { parseDate, type DateInput } from './date.helpers'

export const REMAINING_DAY_MS = 86_400_000

export function getRemainingMilliseconds(target: DateInput, now: number): number {
  const timestamp = typeof target === 'number' ? target : parseDate(target)?.getTime()
  return timestamp === undefined || !Number.isFinite(timestamp) || !Number.isFinite(now)
    ? 0
    : Math.max(0, timestamp - now)
}

export function getRemainingTimeVariant(remainingMs: number): 'warning' | 'error' | null {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return null
  return remainingMs > REMAINING_DAY_MS ? 'warning' : 'error'
}

export function formatRemainingTime(remainingMs: number, t: TFunction): string | null {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return null
  if (remainingMs < 60_000) return t('remaining_time.less_than_minute')
  const totalMinutes = Math.floor(remainingMs / 60_000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  const time =
    hours || days ? t('remaining_time.hours_minutes', { hours, minutes }) : t('remaining_time.minutes', { minutes })
  return days
    ? t('remaining_time.days_and_time', { days: t('remaining_time.day', { count: days }), time })
    : t('remaining_time.time', { time })
}
