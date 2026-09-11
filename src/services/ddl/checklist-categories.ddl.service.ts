import { $authHttp } from '@/utils/auth-http'

export async function getCheckListCategoriesDdl() {
  const res = await $authHttp.get<ApiResponse<IDDl[]>>({
    url: '/v1/ddl/checklist-categories',
  })

  return res.data?.data ?? []
}
