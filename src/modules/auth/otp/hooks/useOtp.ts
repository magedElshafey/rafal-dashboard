import { useMutation } from '@tanstack/react-query'

import type { AuthPortal } from '@/modules/auth/types/auth.types'
import type { ForgotPasswordPayload } from '@/modules/auth/forgot-password/types/forget-password.types'
import type { VerifyResetOtpPayload } from '@/modules/auth/otp/types/otp.types'
import { verifyResetOtp, resendResetOtp } from '@/modules/auth/otp/services/otp.services'

type VerifyResetOtpVariables = {
  portal: AuthPortal
  payload: VerifyResetOtpPayload
}

type ResendResetOtpVariables = {
  portal: AuthPortal
  payload: ForgotPasswordPayload
}

export function useVerifyResetOtpMutation() {
  return useMutation({
    mutationFn: ({ portal, payload }: VerifyResetOtpVariables) => {
      return verifyResetOtp(portal, payload)
    },
  })
}

export function useResendResetOtpMutation() {
  return useMutation({
    mutationFn: ({ portal, payload }: ResendResetOtpVariables) => {
      return resendResetOtp(portal, payload)
    },
  })
}
