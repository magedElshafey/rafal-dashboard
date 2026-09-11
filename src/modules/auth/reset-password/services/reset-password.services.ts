import { getAuthPathByPortal } from '@/config/auth.helpers'
import { $authHttp } from '@/utils/auth-http'

import type { AuthPortal } from '@/modules/auth/types/auth.types'
import type {
  ResetPasswordPayload,
  ResetPasswordResponse,
} from '@/modules/auth/forgot-password/types/forget-password.types'

export async function resetPassword(portal: AuthPortal, payload: ResetPasswordPayload) {
  const response = await $authHttp.post<ApiResponse<ResetPasswordResponse>>({
    url: getAuthPathByPortal(portal, '/reset-password'),
    data: {
      reset_token: payload.resetToken,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    },
    isFormData: false,
  })

  return response.data.data
}
