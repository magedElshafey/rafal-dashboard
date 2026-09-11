import type { AppRole } from '@/modules/auth/types/auth.types'

export type NotificationType = string
export type NotificationListType = 'all' | NotificationType
export type NotificationListFilters = { type: NotificationListType; unreadOnly: boolean }
export type LocalizedNotificationText = { ar: string | null; en: string | null }
export type NotificationItem = {
  id: string
  data: { title: LocalizedNotificationText; body: LocalizedNotificationText }
  created_at: string
  is_read: boolean
  type: NotificationType
  sender?: {
    name: string
    role: AppRole
  }
}
export type NotificationExtra = { unread_count: number; read_count: number }
export type NotificationsPageData = PaginatedData<NotificationItem, NotificationExtra>
export type NotificationsResponse = ApiResponse<NotificationsPageData>
export type NotificationActionResponse = ApiResponse<string>
