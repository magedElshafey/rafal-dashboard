import { $authHttp } from '@/utils/auth-http'

export type NotificationChannelDdlItem = IDDl
export type NotificationChannelsDdlResponse = ApiResponse<NotificationChannelDdlItem[]>

export const NOTIFICATION_CHANNELS_DDL_ENDPOINT = '/v1/ddl/notification-channels'

export async function getNotificationChannelsDdl(module: string): Promise<NotificationChannelDdlItem[]> {
  const response = await $authHttp.get<NotificationChannelsDdlResponse>({
    url: NOTIFICATION_CHANNELS_DDL_ENDPOINT,
    query: { module },
  })

  return response.data.data
}
