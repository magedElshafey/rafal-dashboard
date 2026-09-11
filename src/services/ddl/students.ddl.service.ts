import { $authHttp } from '@/utils/auth-http'
import { cleanQueryParams } from '@/utils/query-params'
export type StudentDDLParams = {
  group?: string | number
  search?: string
}
export type StudentDdl = IDDl & {
  student_id?: string
  main_group_id?: string
  group_id?: string
  sub_group_id?: string
  group?: {
    id?: string
    name?: string
    parent?: {
      id?: string
      name?: string
    } | null
  } | null
}

export async function getStudentsDdl({ group, search }: StudentDDLParams, signal?: AbortSignal) {
  const res = await $authHttp.get<ApiResponse<StudentDdl[]>>({
    url: '/v1/ddl/students',
    query: cleanQueryParams({
      group,
      search,
    }),
    signal,
  })

  return res.data?.data ?? []
}
