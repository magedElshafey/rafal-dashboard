import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { parseDate, type DateInput } from '@/utils/date/date.helpers'
import {
  formatRemainingTime,
  getRemainingMilliseconds,
  getRemainingTimeVariant,
  REMAINING_DAY_MS,
} from '@/utils/date/remaining-time.helpers'

// All mounted countdowns share one timer and one pair of resume listeners.
const subscribers = new Map<() => void, number>()
let now = Date.now()
let timer: ReturnType<typeof setTimeout> | undefined
const getSnapshot = () => now

function schedule() {
  clearTimeout(timer)
  if (!subscribers.size) return
  const current = Date.now()
  let next = Number.POSITIVE_INFINITY
  for (const target of subscribers.values()) {
    if (target > current) next = Math.min(next, current + 60_000)
    for (const boundary of [target, target - REMAINING_DAY_MS]) {
      if (boundary > current) next = Math.min(next, boundary)
    }
  }
  if (Number.isFinite(next)) timer = setTimeout(tick, Math.max(1, next - current))
}

function tick() {
  now = Date.now()
  subscribers.forEach((_target, listener) => listener())
  schedule()
}

function subscribe(listener: () => void, target: number) {
  subscribers.set(listener, target)
  if (subscribers.size === 1) {
    now = Date.now()
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
  }
  schedule()
  return () => {
    subscribers.delete(listener)
    schedule()
    if (!subscribers.size) {
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }
}

export function useRemainingTime(target: DateInput) {
  const { t } = useTranslation()
  const timestamp = useMemo(() => parseDate(target)?.getTime() ?? Number.NaN, [target])
  const subscribeToTarget = useCallback((listener: () => void) => subscribe(listener, timestamp), [timestamp])
  useSyncExternalStore(subscribeToTarget, getSnapshot, getSnapshot)
  // Prop-driven renders also use the current instant, even between shared ticks.
  const remainingMs = getRemainingMilliseconds(timestamp, Date.now())
  return { remainingMs, text: formatRemainingTime(remainingMs, t), variant: getRemainingTimeVariant(remainingMs) }
}
