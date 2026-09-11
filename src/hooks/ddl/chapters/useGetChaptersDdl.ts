import { queryTimes } from '@/lib/react-query/query-times'
import { getChaptersDdl, type ChaptersDdlParams } from '@/services/ddl/chapters.ddl.service'
import { normalizeGroupIds } from '@/utils/normalize-group-ids'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

const EMPTY_CHAPTERS_DDL: IDDl[] = []
const CHAPTERS_DDL_QUERY_KEY = ['chapters-ddl'] as const

const chapterQueryKey = (groupIds: string) => [...CHAPTERS_DDL_QUERY_KEY, { 'group_id[]': groupIds }] as const

type ChaptersDdlOptions = {
  enabled?: boolean
}

const useGetChaptersDdl = (params?: ChaptersDdlParams, options: ChaptersDdlOptions = {}) => {
  const groupIdsKey = normalizeGroupIds(params?.groupIds).join(',')
  const normalizedGroupIds = useMemo(() => (groupIdsKey ? groupIdsKey.split(',') : []), [groupIdsKey])

  const query = useQuery({
    queryKey: groupIdsKey ? chapterQueryKey(groupIdsKey) : CHAPTERS_DDL_QUERY_KEY,
    queryFn: ({ signal }) => getChaptersDdl({ groupIds: normalizedGroupIds }, signal),
    enabled: (options.enabled ?? true) && normalizedGroupIds.length > 0,
    staleTime: queryTimes.veryLong,
    gcTime: queryTimes.veryLong,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_CHAPTERS_DDL,
  }
}

export const useGetChaptersByGroupIdsDdl = (groupIds?: readonly (string | number | null | undefined)[]) => {
  const normalizedGroupIds = normalizeGroupIds(groupIds)
  const query = useGetChaptersDdl({ groupIds: normalizedGroupIds })

  return {
    ...query,
    groupIds: normalizedGroupIds,
    isDisabled: normalizedGroupIds.length === 0,
  }
}

export default useGetChaptersDdl
