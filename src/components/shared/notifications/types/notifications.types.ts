import type { ComponentType } from 'react'

export type NotificationType = 'assignment' | 'exam' | 'course' | 'system' | 'report'

export type NotificationNavigationType =
  | 'home'
  | 'assignments'
  | 'assignment-details'
  | 'exams'
  | 'exam-details'
  | 'courses'
  | 'course-details'
  | 'reports'
  | 'profile'
  | 'settings'
  | 'none'

export type NotificationNavigation = {
  type: NotificationNavigationType
  entityId?: number | string
  path?: string
}

export type Notification = {
  id: number
  title: string
  description: string
  createdAt: string
  isRead: boolean
  type: NotificationType
  navigation: NotificationNavigation
}

export type NotificationIcon = ComponentType<{
  className?: string
  'aria-hidden'?: boolean
}>

export type NotificationsQueryData = {
  notifications: Notification[]
  unreadCount: number
}
