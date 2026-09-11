import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'

import { useAuth } from '@/store/auth'
import { getHomePathByRole, getPortalByPathname } from '@/config/auth.helpers'
import { handleErrorFields } from '@/utils/error/errorHandler'
import {
  getPushMessagingAccountKey,
  showForegroundPushMessage,
} from '@/modules/shared/push-notifications/components/AuthenticatedPushMessaging'
import { startPostLoginPushMessaging } from '@/modules/shared/push-notifications/services/push-messaging-session'

import type { LoginFormValues } from '@/modules/auth/login/types/login.types'

const LOGIN_DEFAULT_VALUES: LoginFormValues = {
  phone: '',
  password: '',
  rememberMe: false,
  countryCode: '+20',
}

const useLoginActions = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuth((state) => state.login)

  const portal = useMemo(() => {
    return getPortalByPathname(location.pathname)
  }, [location.pathname])
  const defaultValues = useMemo<LoginFormValues>(() => LOGIN_DEFAULT_VALUES, [])

  const onSubmit = useCallback(
    async (values: LoginFormValues) => {
      if (!portal) {
        toast.error(t('auth.login.invalid_portal'))
        return
      }
      try {
        const session = await login(portal, {
          phone: values.phone,
          password: values.password,
          rememberMe: values.rememberMe,
          countryCode: values.countryCode,
        })
        const accountKey = getPushMessagingAccountKey({
          isAuthenticated: true,
          portal: session.portal,
          role: session.role,
          userId: session.user.id,
        })
        if (accountKey) {
          void startPostLoginPushMessaging(accountKey, showForegroundPushMessage)
        }
        navigate(getHomePathByRole(session.role), {
          replace: true,
        })
      } catch (error) {
        const errorMessage = isAxiosError(error)
          ? handleErrorFields((error.response?.data as { errors?: Record<string, unknown> })?.errors ?? {})
          : null

        toast.error(errorMessage || t('auth.login.server_error'))
      }
    },
    [login, navigate, portal, t]
  )

  return {
    defaultValues,
    onSubmit,
    portal,
  }
}

export default useLoginActions
