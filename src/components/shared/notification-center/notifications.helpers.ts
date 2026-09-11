import type { NotificationListFilters, NotificationListType } from './types'
import type { AppRole } from '@/modules/auth/types/auth.types'

const NOTIFICATION_DESTINATION_BY_TYPE = {
  assignment: '/assignments',
  exam: '/exams',
  session: '/sessions',
} as const

export function getNotificationDestination(
  type: string | null | undefined,
  role: AppRole | null = null
): string | null {
  if (role === 'parent' && type === 'session') return null
  if (type === 'report' && (role === 'admin' || role === 'assistant')) return '/reports-center'
  if (type && Object.prototype.hasOwnProperty.call(NOTIFICATION_DESTINATION_BY_TYPE, type)) {
    return NOTIFICATION_DESTINATION_BY_TYPE[type as keyof typeof NOTIFICATION_DESTINATION_BY_TYPE]
  }
  return null
}

type LocalizedNotificationText = { ar?: string | null; en?: string | null }
export type ParsedNotificationSearchParams = {
  filters: NotificationListFilters
  normalized: { type?: string; unread?: 'true' }
  hasInvalidValues: boolean
}

const NOTIFICATION_TYPE_LABEL_KEYS = {
  assignment: 'notifications.categories.assignment',
  exam: 'notifications.categories.exam',
  session: 'notifications.categories.session',
  report: 'notifications.categories.report',
  announcement: 'notifications.categories.announcement',
  general: 'notifications.categories.general',
} as const

export function normalizeNotificationTypeOptions(options: readonly IDDl[]): IDDl[] {
  const seenValues = new Set<string>()
  return options.reduce<IDDl[]>((normalized, option) => {
    const value = typeof option?.value === 'string' ? option.value : ''
    const label = typeof option?.label === 'string' ? option.label.trim() : ''
    if (!value || value !== value.trim() || value.toLowerCase() === 'all' || !label || seenValues.has(value))
      return normalized
    seenValues.add(value)
    normalized.push({ value, label })
    return normalized
  }, [])
}

export function getLocalizedNotificationText(
  text: LocalizedNotificationText | null | undefined,
  language: string,
  fallback = ''
) {
  const selectedLocale = language.toLowerCase().startsWith('ar') ? 'ar' : 'en'
  const otherLocale = selectedLocale === 'ar' ? 'en' : 'ar'
  return text?.[selectedLocale]?.trim() || text?.[otherLocale]?.trim() || fallback
}

export function getNotificationTypeLabelKey(type: string | null | undefined): string {
  if (type && Object.prototype.hasOwnProperty.call(NOTIFICATION_TYPE_LABEL_KEYS, type))
    return NOTIFICATION_TYPE_LABEL_KEYS[type as keyof typeof NOTIFICATION_TYPE_LABEL_KEYS]
  return 'notifications.categories.unknown'
}

export function normalizeNotificationCount(value: unknown): number {
  const numericValue =
    typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN
  if (!Number.isFinite(numericValue)) return 0
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.trunc(numericValue)))
}

export function parseNotificationSearchParams(searchParams: URLSearchParams): ParsedNotificationSearchParams {
  const typeValues = searchParams.getAll('type')
  const unreadValues = searchParams.getAll('unread')
  const typeValue = typeValues[0]
  const unreadValue = unreadValues[0]
  const isFilterType =
    typeValue !== undefined && typeValue !== '' && typeValue !== 'all' && typeValue === typeValue.trim()
  const type: NotificationListType = isFilterType ? typeValue : 'all'
  const unreadOnly = unreadValue === 'true'
  return {
    filters: { type, unreadOnly },
    normalized: { ...(type === 'all' ? {} : { type }), ...(unreadOnly ? { unread: 'true' as const } : {}) },
    hasInvalidValues:
      typeValues.length > 1 ||
      (typeValue !== undefined && !isFilterType) ||
      unreadValues.length > 1 ||
      (unreadValue !== undefined && unreadValue !== 'true'),
  }
}

export function flattenUniqueNotifications<TItem extends { id: string | number }>(
  pages: readonly { items: readonly TItem[] }[] | null | undefined
): TItem[] {
  if (!pages) return []
  const ids = new Set<string | number>()
  const items: TItem[] = []
  for (const page of pages)
    for (const item of page.items)
      if (!ids.has(item.id)) {
        ids.add(item.id)
        items.push(item)
      }
  return items
}
