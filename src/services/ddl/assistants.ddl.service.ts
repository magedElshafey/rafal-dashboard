import { $authHttp } from '@/utils/auth-http'
import { cleanQueryParams } from '@/utils/query-params'

export type GetAssistantsDdlParams = {
  group?: string
  /** @deprecated Use `group`; retained for backward-compatible callers. */
  group_id?: string
}

export async function getAssistantsDdl({ group, group_id }: GetAssistantsDdlParams = {}): Promise<IDDl[]> {
  const normalizedGroup = group?.trim()
  const normalizedGroupId = group_id?.trim()
  const query = normalizedGroup
    ? { group_id: normalizedGroup }
    : normalizedGroupId
      ? { group_id: normalizedGroupId }
      : undefined

  const response = await $authHttp.get<ApiResponse<IDDl[]>>({
    url: '/v1/ddl/assistants',
    query: cleanQueryParams(query),
  })

  return response.data?.data ?? []
}
