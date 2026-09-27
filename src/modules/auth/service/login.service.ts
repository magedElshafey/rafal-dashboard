import type { LoginPayload, LoginResponseData } from '@/modules/auth/types/auth.types'
import { $http } from '@/utils/http'

export async function loginRequest(data: LoginPayload) {
  const formData = new FormData()
  formData.append('email', data.email)
  formData.append('password', data.password)

  const response = await $http.post<{ data: LoginResponseData }>({
    url: '/dashboard/auth/login',
    data: formData,
    isFormData: true,
    suppressErrorNotification: true,
  })

  return response.data.data
}
