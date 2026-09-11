import { queryTimes } from '@/lib/react-query/query-times'
import { getTaskStatusDdl } from '@/services/ddl/task-status.ddl.service'
import { useQuery } from '@tanstack/react-query'

const EMPTY_STATUS_DDL: IDDl[] = []
const TASK_STATUS_QUERY_KEY = ['task-status'] as const

const useGetTaskStatus = () => {
  const query = useQuery({
    queryKey: TASK_STATUS_QUERY_KEY,
    queryFn: getTaskStatusDdl,
    staleTime: queryTimes.veryLong,
    gcTime: queryTimes.veryLong,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_STATUS_DDL,
  }
}

export default useGetTaskStatus
