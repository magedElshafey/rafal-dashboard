import { getAuthPathByPortal } from '@/config/auth.helpers'
import { $authHttp } from '@/utils/auth-http'

import type { AuthPortal } from '@/modules/auth/types/auth.types'
import type { VerifyResetOtpPayload, VerifyResetOtpResponse } from '@/modules/auth/otp/types/otp.types'
import type { ForgotPasswordPayload } from '@/modules/auth/forgot-password/types/forget-password.types'

export async function verifyResetOtp(portal: AuthPortal, payload: VerifyResetOtpPayload) {
  const response = await $authHttp.post<ApiResponse<VerifyResetOtpResponse>>({
    url: getAuthPathByPortal(portal, '/verify-otp'),
    data: {
      phone: payload.phone,
      country_code: payload.countryCode,
      otp: payload.code,
    },
    isFormData: false,
  })

  const data = response.data.data

  return {
    ...data,
    resetToken: data.resetToken ?? data.reset_token,
  }
}

export async function resendResetOtp(portal: AuthPortal, payload: ForgotPasswordPayload) {
  const response = await $authHttp.post<ApiResponse<VerifyResetOtpResponse>>({
    url: getAuthPathByPortal(portal, '/forgot-password'),
    data: {
      phone: payload.phone,
      country_code: payload.countryCode,
    },
    isFormData: false,
  })

  return response.data.data
}
