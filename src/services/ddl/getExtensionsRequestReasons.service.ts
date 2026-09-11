import { $authHttp } from '@/utils/auth-http'

export async function getExtensionsRequestReasons() {
  const res = await $authHttp.get<ApiResponse<IDDl[]>>({
    url: '/v1/ddl/extension-reasons',
  })

  return res.data?.data ?? []
}
