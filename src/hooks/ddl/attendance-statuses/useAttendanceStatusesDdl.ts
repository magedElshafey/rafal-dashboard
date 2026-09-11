import { useQuery } from '@tanstack/react-query'

import { queryTimes } from '@/lib/react-query/query-times'
import { getAttendanceStatusesDdl } from '@/services/ddl/attendance-statuses.ddl.service'
import type { AttendanceStatusDdlItem } from '@/services/ddl/attendance-statuses.ddl.service'

const EMPTY_ATTENDANCE_STATUSES_DDL: AttendanceStatusDdlItem[] = []

export const ATTENDANCE_STATUSES_DDL_QUERY_KEY = ['ddl', 'attendance-statuses'] as const

export function useAttendanceStatusesDdl() {
  const query = useQuery({
    queryKey: ATTENDANCE_STATUSES_DDL_QUERY_KEY,
    queryFn: getAttendanceStatusesDdl,
    staleTime: queryTimes.veryLong,
    gcTime: queryTimes.veryLong,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_ATTENDANCE_STATUSES_DDL,
  }
}
