import { $authHttp } from '@/utils/auth-http'
import { cleanQueryParams } from '@/utils/query-params'

type GroupDdlType = 'main' | 'sub'

export type MainGroupDdlItem = IDDl & {
  sub_groups_count: number
}

type GetGroupsDdlParams = {
  type: GroupDdlType
  groupId?: string | number
}

export async function getGroupsDdl<TItem extends IDDl = IDDl>(
  { type, groupId }: GetGroupsDdlParams,
  signal?: AbortSignal
) {
  if (type === 'sub') {
    if (!groupId) return []
  }

  const res = await $authHttp.get<ApiResponse<TItem[]>>({
    url: '/v1/ddl/groups',
    query: cleanQueryParams({
      type,
      group_id: type === 'sub' ? groupId : undefined,
    }),
    signal,
  })

  return res.data?.data ?? []
}

export function getMainGroupsDdl(signal?: AbortSignal) {
  return getGroupsDdl<MainGroupDdlItem>(
    {
      type: 'main',
    },
    signal
  )
}

export function getSubGroupsDdl(groupId: string | number, signal?: AbortSignal) {
  return getGroupsDdl(
    {
      type: 'sub',
      groupId,
    },
    signal
  )
}
