import { $authHttp } from '@/utils/auth-http'

export async function getAdminsDdl(): Promise<IDDl[]> {
  const response = await $authHttp.get<ApiResponse<IDDl[]>>({
    url: '/v1/ddl/admins',
  })

  return response.data?.data ?? []
}
