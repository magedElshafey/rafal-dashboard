import { $authHttp } from '@/utils/auth-http'
import { cleanQueryParams } from '@/utils/query-params'
import { normalizeGroupIds, type GroupId } from '@/utils/normalize-group-ids'

export type ChaptersDdlParams = {
  groupIds: readonly (GroupId | null | undefined)[]
}

export async function getChaptersDdl(params?: ChaptersDdlParams, signal?: AbortSignal) {
  const normalizedGroupIds = normalizeGroupIds(params?.groupIds)
  const res = await $authHttp.get<ApiResponse<IDDl[]>>({
    url: '/v1/ddl/chapters',
    query: cleanQueryParams({ 'group_id[]': normalizedGroupIds }),
    signal,
  })

  return res.data?.data ?? []
}
