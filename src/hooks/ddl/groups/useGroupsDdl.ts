import { useMemo } from 'react'
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query'

import { getMainGroupsDdl, getSubGroupsDdl } from '@/services/ddl/groups.ddl.service'
import type { MainGroupDdlItem } from '@/services/ddl/groups.ddl.service'
import { normalizeGroupIds } from '@/utils/normalize-group-ids'

import { groupsDdlQueryKeys } from './groups-ddl.query-keys'

export { normalizeGroupIds } from '@/utils/normalize-group-ids'

const EMPTY_DDL: IDDl[] = []
const EMPTY_MAIN_GROUP_DDL: MainGroupDdlItem[] = []

const DDL_STALE_TIME = 5 * 60 * 1000
const DDL_GC_TIME = 30 * 60 * 1000

type GroupId = string | number

type SubGroupsQueriesResult = {
  data: IDDl[]
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  isPartialError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

function combineSubGroupsQueries(results: UseQueryResult<IDDl[], Error>[]): SubGroupsQueriesResult {
  const subGroupsById = new Map<string, IDDl>()

  results.forEach((result) => {
    result.data?.forEach((subGroup) => {
      subGroupsById.set(String(subGroup.value), subGroup)
    })
  })

  const data = Array.from(subGroupsById.values())
  const isError = results.some((result) => result.isError)

  return {
    data: data.length ? data : EMPTY_DDL,

    isLoading: results.some((result) => result.isLoading),

    isFetching: results.some((result) => result.isFetching),

    isError,

    isPartialError: isError && results.some((result) => result.isSuccess),

    error: results.find((result) => result.error)?.error ?? null,

    refetch: () => Promise.allSettled(results.filter((result) => result.isError).map((result) => result.refetch())),
  }
}

export function useMainGroupsDdl() {
  const query = useQuery({
    queryKey: groupsDdlQueryKeys.main(),
    queryFn: ({ signal }) => getMainGroupsDdl(signal),
    staleTime: DDL_STALE_TIME,
    gcTime: DDL_GC_TIME,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_MAIN_GROUP_DDL,
  }
}

export function useSubGroupsDdl(groupId?: string | number | null) {
  const enabled = Boolean(groupId)

  const query = useQuery({
    queryKey: groupsDdlQueryKeys.sub(groupId ?? ''),

    queryFn: ({ signal }) => getSubGroupsDdl(groupId as string | number, signal),

    enabled,
    staleTime: DDL_STALE_TIME,
    gcTime: DDL_GC_TIME,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_DDL,
  }
}

export function useSubGroupsByGroupIdsDdl(groupIds?: readonly (GroupId | null | undefined)[]) {
  const groupIdsKey = normalizeGroupIds(groupIds).join('\u0000')
  const normalizedGroupIds = useMemo(() => (groupIdsKey ? groupIdsKey.split('\u0000') : []), [groupIdsKey])

  const query = useQueries({
    queries: normalizedGroupIds.map((groupId) => ({
      queryKey: groupsDdlQueryKeys.sub(groupId),

      queryFn: ({ signal }: { signal: AbortSignal }) => getSubGroupsDdl(groupId, signal),

      staleTime: DDL_STALE_TIME,
      gcTime: DDL_GC_TIME,
    })),

    combine: combineSubGroupsQueries,
  })

  return {
    ...query,

    groupIds: normalizedGroupIds,

    isDisabled: normalizedGroupIds.length === 0 || query.isLoading,
  }
}
