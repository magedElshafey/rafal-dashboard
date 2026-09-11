import { useMemo } from 'react'
import { useQueries, useQuery, type UseQueryResult } from '@tanstack/react-query'

import { queryTimes } from '@/lib/react-query/query-times'
import { getStudentsDdl, type StudentDdl } from '@/services/ddl/students.ddl.service'

const EMPTY_STUDENTS: StudentDdl[] = []

type SubGroupId = string | number

export function normalizeStudentSubGroupIds(ids?: readonly (SubGroupId | null | undefined)[]) {
  return Array.from(
    new Set((ids ?? []).map((id) => (id === null || id === undefined ? '' : String(id).trim())).filter(Boolean))
  ).sort((first, second) => first.localeCompare(second))
}

function mergeStudentQueries(results: UseQueryResult<StudentDdl[], Error>[]) {
  const byId = new Map<string, StudentDdl>()
  results.forEach((result) => {
    result.data?.forEach((student) => {
      const id = String(student.value || student.student_id).trim()
      if (id && !byId.has(id)) byId.set(id, student)
    })
  })
  return Array.from(byId.values())
}

export function useStudentsMultiDdl({
  subGroupIds,
  enabled = true,
  requestMode = 'per-subgroup',
}: {
  subGroupIds?: readonly (SubGroupId | null | undefined)[]
  enabled?: boolean
  requestMode?: 'per-subgroup' | 'comma-separated'
}) {
  const normalizedIds = normalizeStudentSubGroupIds(subGroupIds)
  const idsKey = normalizedIds.join('\u0000')
  const stableIds = useMemo(() => (idsKey ? idsKey.split('\u0000') : []), [idsKey])
  const commaSeparatedGroupIds = stableIds.join(',')
  const shouldUseCommaSeparatedRequest = requestMode === 'comma-separated'

  const commaSeparatedQuery = useQuery({
    queryKey: ['students-ddl', commaSeparatedGroupIds, undefined] as const,
    queryFn: ({ signal }) => getStudentsDdl({ group: commaSeparatedGroupIds }, signal),
    enabled: enabled && shouldUseCommaSeparatedRequest && stableIds.length > 0,
    staleTime: queryTimes.long,
    gcTime: queryTimes.long,
  })

  const queries = useQueries({
    queries:
      enabled && !shouldUseCommaSeparatedRequest
        ? stableIds.map((subGroupId) => ({
            queryKey: ['students-ddl', subGroupId, undefined] as const,
            queryFn: ({ signal }: { signal: AbortSignal }) => getStudentsDdl({ group: subGroupId }, signal),
            staleTime: queryTimes.long,
            gcTime: queryTimes.long,
          }))
        : [],
  }) as UseQueryResult<StudentDdl[], Error>[]

  const students = useMemo(
    () => (shouldUseCommaSeparatedRequest ? (commaSeparatedQuery.data ?? []) : mergeStudentQueries(queries)),
    [commaSeparatedQuery.data, queries, shouldUseCommaSeparatedRequest]
  )
  const isError = shouldUseCommaSeparatedRequest ? commaSeparatedQuery.isError : queries.some((query) => query.isError)
  const hasSuccess = shouldUseCommaSeparatedRequest
    ? commaSeparatedQuery.isSuccess
    : queries.some((query) => query.isSuccess)

  return {
    subGroupIds: stableIds,
    students: students.length ? students : EMPTY_STUDENTS,
    isLoading: shouldUseCommaSeparatedRequest
      ? commaSeparatedQuery.isLoading
      : queries.some((query) => query.isLoading),
    isFetching: shouldUseCommaSeparatedRequest
      ? commaSeparatedQuery.isFetching
      : queries.some((query) => query.isFetching),
    isError,
    isPartialError: isError && hasSuccess,
    error: shouldUseCommaSeparatedRequest
      ? (commaSeparatedQuery.error ?? null)
      : (queries.find((query) => query.error)?.error ?? null),
    retry: () =>
      shouldUseCommaSeparatedRequest
        ? commaSeparatedQuery.refetch()
        : Promise.allSettled(queries.filter((query) => query.isError).map((query) => query.refetch())),
    isDisabled: !enabled || stableIds.length === 0,
  }
}
