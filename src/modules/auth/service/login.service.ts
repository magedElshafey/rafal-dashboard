import type { LoginPayload, LoginResponseData } from '@/modules/auth/types/auth.types'
import { $http } from '@/utils/http'

export async function loginRequest(data: LoginPayload) {
  const response = await $http.post<{ data: LoginResponseData }>({
    url: '/auth/login',
    data: {
      phone: data.phone,
      password: data.password,
      remember_me: data.rememberMe ? 1 : 0,
      country_code: data.countryCode,
    },
    isFormData: false,
  })

  return response.data.data
}
