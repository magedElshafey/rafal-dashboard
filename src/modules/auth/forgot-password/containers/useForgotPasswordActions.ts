import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getPortalByPathname } from '@/config/auth.helpers'
import { buildPortalPath } from '@/components/core/portal-link/utils/portal-path.helpers'
import { useOtpFlow } from '@/store/otp-flow'

import type { ForgotPasswordFormValues } from '@/modules/auth/forgot-password/types/forget-password.types'
import { useForgotPasswordMutation } from '@/modules/auth/forgot-password/hooks/useForgetPassword'
import { isAxiosError } from 'axios'
import { handleErrorFields } from '@/utils/error/errorHandler'

const FORGOT_PASSWORD_DEFAULT_VALUES: ForgotPasswordFormValues = {
  phone: '',
  countryCode: '+20',
}
const RESET_PASSWORD_PATH = '/reset-password-verifications'

const useForgotPasswordActions = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const setResetFlow = useOtpFlow((state) => state.setResetFlow)
  const forgotPasswordMutation = useForgotPasswordMutation()

  const portal = useMemo(() => {
    return getPortalByPathname(location.pathname)
  }, [location.pathname])

  const defaultValues = useMemo<ForgotPasswordFormValues>(() => {
    return FORGOT_PASSWORD_DEFAULT_VALUES
  }, [])

  const onSubmit = useCallback(
    async (values: ForgotPasswordFormValues) => {
      if (!portal) {
        toast.error(t('auth.forgot_password.invalid_portal'))
        return
      }

      try {
        const response = await forgotPasswordMutation.mutateAsync({
          portal,
          payload: {
            phone: values.phone,
            countryCode: values.countryCode,
          },
        })

        setResetFlow({
          phone: values.phone,
          countryCode: values.countryCode,
          portal,
        })

        toast.success(response.message || t('auth.forgot_password.success'))

        navigate(
          buildPortalPath(RESET_PASSWORD_PATH, {
            portal,
          })
        )
      } catch (error) {
        const errorMessage = isAxiosError(error)
          ? handleErrorFields((error.response?.data as { errors?: Record<string, unknown> })?.errors ?? {})
          : null
        toast.error(errorMessage || t('auth.forgot_password.server_error'))
      }
    },
    [forgotPasswordMutation, location.pathname, navigate, portal, setResetFlow, t]
  )

  return {
    portal,
    defaultValues,
    onSubmit,
    isPending: forgotPasswordMutation.isPending,
  }
}

export default useForgotPasswordActions
