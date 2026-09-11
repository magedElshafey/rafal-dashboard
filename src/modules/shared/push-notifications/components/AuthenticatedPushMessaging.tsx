import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/store/auth'

import type { ForegroundPushMessage } from '../services/firebase-messaging.service'
import {
  resetPostLoginPushMessagingAttempts,
  startAuthenticatedPushMessaging,
  stopAuthenticatedPushMessaging,
} from '../services/push-messaging-session'

export function getPushMessagingAccountKey({
  isAuthenticated,
  portal,
  role,
  userId,
}: {
  isAuthenticated: boolean
  portal: string | null
  role: string | null
  userId: EntityId | null | undefined
}): string | null {
  if (!isAuthenticated || !portal || !role || userId === null || userId === undefined) return null

  return `${portal}:${role}:${String(userId)}`
}

export function showForegroundPushMessage(message: ForegroundPushMessage): void {
  const title = message.notification?.title?.trim()
  const body = message.notification?.body?.trim()

  if (!title && !body) return

  toast.info(title || body, title && body ? { description: body } : undefined)
}

export function AuthenticatedPushMessaging() {
  const accountKey = useAuth((state) =>
    getPushMessagingAccountKey({
      isAuthenticated: state.isAuthenticated,
      portal: state.portal,
      role: state.role,
      userId: state.user?.id,
    })
  )
  const handleForegroundMessage = useCallback(showForegroundPushMessage, [])

  useEffect(() => {
    if (!accountKey) {
      stopAuthenticatedPushMessaging()
      resetPostLoginPushMessagingAttempts()
      return
    }

    void startAuthenticatedPushMessaging(accountKey, handleForegroundMessage)

    return () => {
      stopAuthenticatedPushMessaging(accountKey)
    }
  }, [accountKey, handleForegroundMessage])

  return null
}
