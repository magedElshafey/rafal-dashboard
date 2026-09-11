import { $http } from '@/utils/http'

export const postEmailRequest = (url: string, email: string) => {
  return $http.post<{
    data: boolean
  }>({
    url,
    data: {
      email,
    },
  })
}
