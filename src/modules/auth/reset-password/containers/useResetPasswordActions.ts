import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { buildPortalPath } from '@/components/core/portal-link/utils/portal-path.helpers'
import { useOtpFlow } from '@/store/otp-flow'
import { useResetPasswordMutation } from '@/modules/auth/reset-password/hooks/useResetPassword'

import type { ResetPasswordFormValues } from '@/modules/auth/forgot-password/types/forget-password.types'
import { isAxiosError } from 'axios'
import { handleErrorFields } from '@/utils/error/errorHandler'

const RESET_PASSWORD_DEFAULT_VALUES: ResetPasswordFormValues = {
  password: '',
  passwordConfirmation: '',
}

const useResetPasswordActions = () => {
  const { t } = useTranslation()

  const phone = useOtpFlow((state) => state.phone)
  const countryCode = useOtpFlow((state) => state.countryCode)
  const resetToken = useOtpFlow((state) => state.resetToken)
  const portal = useOtpFlow((state) => state.portal)
  const clearOtpFlow = useOtpFlow((state) => state.clear)

  const resetPasswordMutation = useResetPasswordMutation()

  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false)

  const defaultValues = useMemo<ResetPasswordFormValues>(() => {
    return RESET_PASSWORD_DEFAULT_VALUES
  }, [])

  const loginPath = useMemo(() => {
    return portal ? buildPortalPath('/login', { portal }) : '/user/login'
  }, [portal])

  const onSubmit = useCallback(
    async (values: ResetPasswordFormValues) => {
      if (!portal || !phone || !countryCode || !resetToken) {
        toast.error(t('auth.reset_password.missing_flow_data'))
        return
      }

      try {
        await resetPasswordMutation.mutateAsync({
          portal,
          payload: {
            resetToken,
            password: values.password,
            passwordConfirmation: values.passwordConfirmation,
          },
        })

        setIsSuccessDialogOpen(true)
      } catch (error) {
        const errorMessage = isAxiosError(error)
          ? handleErrorFields((error.response?.data as { errors?: Record<string, unknown> })?.errors ?? {})
          : null
        toast.error(errorMessage || t('auth.forgot_password.server_error'))
      }
    },
    [countryCode, phone, portal, resetPasswordMutation, resetToken, t]
  )

  const handleSuccessConfirm = useCallback(() => {
    clearOtpFlow()
  }, [clearOtpFlow])

  return {
    defaultValues,
    onSubmit,
    loginPath,
    isSuccessDialogOpen,
    setIsSuccessDialogOpen,
    handleSuccessConfirm,
    isLoading: resetPasswordMutation.isPending,
  }
}

export default useResetPasswordActions
