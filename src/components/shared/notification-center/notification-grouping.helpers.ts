import { formatDateInputValue, formatMonthDayYear, type AppLocale, type DateInput } from '@/utils/date/date.helpers'

export type NotificationDateGroupKind = 'today' | 'yesterday' | 'date' | 'unknown'
export type NotificationDateGroup<TItem> = {
  key: string
  kind: NotificationDateGroupKind
  label: string
  items: TItem[]
}
type NotificationWithDate = { id: string | number; created_at: DateInput }
type GroupNotificationsByDateOptions = { locale?: AppLocale; now?: Date }
const UNKNOWN_DATE_GROUP_KEY = 'unknown-date'

function getCalendarDateKey(value: DateInput): string | null {
  try {
    return formatDateInputValue(value)
  } catch {
    return null
  }
}

export function groupNotificationsByDate<TItem extends NotificationWithDate>(
  notifications: readonly TItem[],
  options: GroupNotificationsByDateOptions = {}
): NotificationDateGroup<TItem>[] {
  const { locale = 'en', now = new Date() } = options
  const todayKey = getCalendarDateKey(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = getCalendarDateKey(yesterday)
  const seenIds = new Set<string | number>()
  const groups = new Map<string, NotificationDateGroup<TItem>>()
  for (const notification of notifications) {
    if (seenIds.has(notification.id)) continue
    seenIds.add(notification.id)
    const calendarKey = getCalendarDateKey(notification.created_at)
    const groupKey = calendarKey ? `date:${calendarKey}` : UNKNOWN_DATE_GROUP_KEY
    let group = groups.get(groupKey)
    if (!group) {
      const kind: NotificationDateGroupKind =
        calendarKey === null
          ? 'unknown'
          : calendarKey === todayKey
            ? 'today'
            : calendarKey === yesterdayKey
              ? 'yesterday'
              : 'date'
      group = {
        key: groupKey,
        kind,
        label: kind === 'date' ? formatMonthDayYear(notification.created_at, { locale }) : '',
        items: [],
      }
      groups.set(groupKey, group)
    }
    group.items.push(notification)
  }
  return [...groups.values()].sort((first, second) => {
    if (first.kind === 'unknown') return second.kind === 'unknown' ? 0 : 1
    if (second.kind === 'unknown') return -1
    return second.key.localeCompare(first.key)
  })
}
