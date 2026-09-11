import { useCallback, useEffect, useState } from 'react'
import { BellRing, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/auth'

import { getPushMessagingAccountKey, showForegroundPushMessage } from './AuthenticatedPushMessaging'
import { isFirebaseMessagingSupported } from '../services/firebase-messaging.service'
import { requestPushMessagingPermission, startAuthenticatedPushMessaging } from '../services/push-messaging-session'

function getCurrentAccountKey(): string | null {
  const state = useAuth.getState()

  return getPushMessagingAccountKey({
    isAuthenticated: state.isAuthenticated,
    portal: state.portal,
    role: state.role,
    userId: state.user?.id,
  })
}

export function PushNotificationPermissionControl() {
  const { t } = useTranslation()
  const accountKey = useAuth((state) =>
    getPushMessagingAccountKey({
      isAuthenticated: state.isAuthenticated,
      portal: state.portal,
      role: state.role,
      userId: state.user?.id,
    })
  )
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(() =>
    typeof Notification === 'undefined' ? null : Notification.permission
  )
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    let isActive = true

    void isFirebaseMessagingSupported().then((supported) => {
      if (isActive) setIsSupported(supported)
    })

    return () => {
      isActive = false
    }
  }, [])

  const handleEnable = useCallback(async () => {
    if (!accountKey || isRequesting) return

    if (permission === 'denied') {
      toast.info(t('notifications.feedback.push_permission_denied'))
      return
    }

    setIsRequesting(true)
    try {
      const result = await requestPushMessagingPermission()
      if (result !== 'unsupported') setPermission(result)
      if (result === 'granted') {
        const currentAccountKey = getCurrentAccountKey()
        if (currentAccountKey) {
          await startAuthenticatedPushMessaging(currentAccountKey, showForegroundPushMessage)
        }
      }
    } finally {
      setIsRequesting(false)
    }
  }, [accountKey, isRequesting, permission, t])

  if (!accountKey || !isSupported || permission === 'granted' || permission === null) return null

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleEnable()}
      disabled={isRequesting}
      aria-busy={isRequesting}
      className="min-h-11 normal-case"
    >
      {isRequesting ? (
        <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden />
      ) : (
        <BellRing className="size-4" aria-hidden />
      )}
      {t(isRequesting ? 'notifications.actions.enabling_push' : 'notifications.actions.enable_push')}
    </Button>
  )
}
