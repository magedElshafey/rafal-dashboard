import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { buildPortalPath } from '@/components/core/portal-link/utils/portal-path.helpers'
import { useOtpFlow } from '@/store/otp-flow'

import type { OtpFormValues } from '@/modules/auth/otp/types/otp.types'
import { useResendResetOtpMutation, useVerifyResetOtpMutation } from '@/modules/auth/otp/hooks/useOtp'

const OTP_DEFAULT_VALUES: OtpFormValues = {
  code: '',
}

const useOtpActions = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const phone = useOtpFlow((state) => state.phone)
  const countryCode = useOtpFlow((state) => state.countryCode)
  const portal = useOtpFlow((state) => state.portal)
  const setResetToken = useOtpFlow((state) => state.setResetToken)
  const clearOtpFlow = useOtpFlow((state) => state.clear)

  const verifyResetOtpMutation = useVerifyResetOtpMutation()
  const resendResetOtpMutation = useResendResetOtpMutation()

  const defaultValues = useMemo<OtpFormValues>(() => OTP_DEFAULT_VALUES, [])

  const onSubmit = useCallback(
    async (values: OtpFormValues) => {
      if (!portal || !phone || !countryCode) {
        toast.error(t('auth.otp.missing_flow_data'))
        return
      }

      try {
        const response = await verifyResetOtpMutation.mutateAsync({
          portal,
          payload: {
            phone,
            countryCode,
            code: values.code,
          },
        })

        if (!response.resetToken) {
          throw new Error('Missing reset token')
        }

        setResetToken(response.resetToken)

        toast.success(response.message || t('auth.otp.verified_successfully'))

        navigate(
          buildPortalPath('/reset-password', {
            portal,
          }),
          {
            replace: true,
          }
        )
      } catch {
        toast.error(t('auth.otp.invalid_code'))
      }
    },
    [countryCode, navigate, phone, portal, setResetToken, t, verifyResetOtpMutation]
  )

  const resendCode = useCallback(async () => {
    if (!portal || !phone || !countryCode) {
      toast.error(t('auth.otp.missing_flow_data'))
      return
    }

    try {
      const response = await resendResetOtpMutation.mutateAsync({
        portal,
        payload: {
          phone,
          countryCode,
        },
      })

      toast.success(response.message || t('auth.otp.resend_success'))
    } catch {
      toast.error(t('auth.otp.resend_error'))
    }
  }, [countryCode, phone, portal, resendResetOtpMutation, t])

  const onChangePhone = useCallback(() => {
    clearOtpFlow()
    const forgotPasswordPath = portal ? buildPortalPath('/forget-password', { portal }) : '/user/forget-password'
    navigate(forgotPasswordPath, {
      replace: true,
    })
  }, [clearOtpFlow, navigate, portal])

  return {
    phone,
    countryCode,
    portal,
    defaultValues,
    onSubmit,
    resendCode,
    onChangePhone,
    isLoading: verifyResetOtpMutation.isPending,
    isResending: resendResetOtpMutation.isPending,
  }
}

export default useOtpActions
