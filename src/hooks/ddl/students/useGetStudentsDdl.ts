import { queryTimes } from '@/lib/react-query/query-times'
import { getStudentsDdl, StudentDdl } from '@/services/ddl/students.ddl.service'
import { useQuery } from '@tanstack/react-query'

const EMPTY_STUDENTS_DDL: StudentDdl[] = []

type UseGetStudentsDdlParams = {
  group?: string | number
  search?: string
}

export function useGetStudentsDdl({ group, search }: UseGetStudentsDdlParams = {}) {
  const normalizedSearch = search?.trim()

  const query = useQuery({
    queryKey: ['students-ddl', group, normalizedSearch],
    queryFn: ({ signal }) => getStudentsDdl({ group, search: normalizedSearch }, signal),
    enabled: Boolean(group || normalizedSearch),
    staleTime: queryTimes.long,
    gcTime: queryTimes.long,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_STUDENTS_DDL,
  }
}
