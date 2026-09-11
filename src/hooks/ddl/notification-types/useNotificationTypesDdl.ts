import { useQuery } from '@tanstack/react-query'

import { queryTimes } from '@/lib/react-query/query-times'
import { getNotificationTypesDdl, type NotificationTypeDdlItem } from '@/services/ddl/notification-types.ddl.service'

const EMPTY_NOTIFICATION_TYPES_DDL: NotificationTypeDdlItem[] = []

export const notificationTypesDdlQueryKey = (actor: string) => ['ddl', 'notification-types', actor] as const
export const NOTIFICATION_TYPES_DDL_QUERY_KEY = notificationTypesDdlQueryKey('user')

export function useNotificationTypesDdl(actor = 'user', { enabled = true }: { enabled?: boolean } = {}) {
  const query = useQuery({
    queryKey: notificationTypesDdlQueryKey(actor),
    queryFn: () => getNotificationTypesDdl(actor),
    enabled,
    staleTime: queryTimes.veryLong,
    gcTime: queryTimes.veryLong,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_NOTIFICATION_TYPES_DDL,
  }
}
