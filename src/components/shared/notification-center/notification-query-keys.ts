import type { QueryKey } from '@tanstack/react-query'

import type { NotificationListFilters, NotificationListType } from './types'

export const DEFAULT_NOTIFICATION_FILTERS: NotificationListFilters = { type: 'all', unreadOnly: false }

export function createNotificationQueryKeys(scope: string) {
  const keys = {
    all: ['notifications', scope] as const,
    lists: () => [...keys.all, 'list'] as const,
    list: (filters: NotificationListFilters = DEFAULT_NOTIFICATION_FILTERS) =>
      [...keys.lists(), filters.type, filters.unreadOnly ? 'unread' : 'all'] as const,
    unreadCount: () => [...keys.all, 'unread-count'] as const,
  }
  return keys
}

export function getNotificationListFiltersFromQueryKey(
  queryKey: QueryKey,
  listsKeyLength: number
): NotificationListFilters {
  const type = queryKey[listsKeyLength]
  const readState = queryKey[listsKeyLength + 1]
  const normalizedType: NotificationListType = typeof type === 'string' && type.trim() ? type : 'all'
  return { type: normalizedType, unreadOnly: readState === 'unread' }
}
