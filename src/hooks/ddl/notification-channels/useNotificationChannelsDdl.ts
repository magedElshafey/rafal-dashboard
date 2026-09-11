import { useQuery } from '@tanstack/react-query'

import { queryTimes } from '@/lib/react-query/query-times'
import {
  getNotificationChannelsDdl,
  type NotificationChannelDdlItem,
} from '@/services/ddl/notification-channels.ddl.service'

const EMPTY_NOTIFICATION_CHANNELS_DDL: NotificationChannelDdlItem[] = []

export const notificationChannelsDdlQueryKey = (module: string) => ['ddl', 'notification-channels', module] as const
export const REMINDER_NOTIFICATION_CHANNELS_DDL_QUERY_KEY = notificationChannelsDdlQueryKey('reminders')

export function useNotificationChannelsDdl(module = 'reminders') {
  const query = useQuery({
    queryKey: notificationChannelsDdlQueryKey(module),
    queryFn: () => getNotificationChannelsDdl(module),
    staleTime: queryTimes.veryLong,
    gcTime: queryTimes.veryLong,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_NOTIFICATION_CHANNELS_DDL,
  }
}
