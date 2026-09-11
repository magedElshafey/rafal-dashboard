import { $authHttp } from '@/utils/auth-http'

export type NotificationTypeDdlItem = IDDl
export type NotificationTypesDdlResponse = ApiResponse<NotificationTypeDdlItem[]>

export const NOTIFICATION_TYPES_DDL_ENDPOINT = '/v1/ddl/notification-types'

export async function getNotificationTypesDdl(actor = 'user'): Promise<NotificationTypeDdlItem[]> {
  const response = await $authHttp.get<NotificationTypesDdlResponse>({
    url: NOTIFICATION_TYPES_DDL_ENDPOINT,
    query: { actor },
  })

  return response.data.data
}
