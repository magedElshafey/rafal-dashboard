import { $authHttp } from '@/utils/auth-http'

export async function getExamTypesDdl() {
  const res = await $authHttp.get<ApiResponse<IDDl[]>>({
    url: '/v1/ddl/exam-types',
  })

  return res.data?.data ?? []
}
