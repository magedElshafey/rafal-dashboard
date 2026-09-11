import { $authHttp } from '@/utils/auth-http'

export async function getTaskStatusDdl() {
  const res = await $authHttp.get<ApiResponse<IDDl[]>>({
    url: '/v1/ddl/student-task-statuses',
  })

  return res.data?.data ?? []
}
