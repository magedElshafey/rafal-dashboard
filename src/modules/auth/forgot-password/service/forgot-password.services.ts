import { getAuthPathByPortal } from '@/config/auth.helpers'
import { $authHttp } from '@/utils/auth-http'

import type { AuthPortal } from '@/modules/auth/types/auth.types'
import type {
  ForgotPasswordPayload,
  ForgotPasswordResponse,
} from '@/modules/auth/forgot-password/types/forget-password.types'

export async function requestForgotPasswordCode(portal: AuthPortal, payload: ForgotPasswordPayload) {
  const response = await $authHttp.post<ApiResponse<ForgotPasswordResponse>>({
    url: getAuthPathByPortal(portal, '/forgot-password'),
    data: {
      phone: payload.phone,
      country_code: payload.countryCode,
    },
    isFormData: false,
  })

  return response.data.data
}
