import { $authHttp } from '@/utils/auth-http'

export async function getPrioritiesDdl() {
  const res = await $authHttp.get<ApiResponse<IDDl[]>>({
    url: '/v1/ddl/checklist-priorities',
  })

  return res.data?.data ?? []
}
