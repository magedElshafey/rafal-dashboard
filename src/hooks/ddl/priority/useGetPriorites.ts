import { queryTimes } from '@/lib/react-query/query-times'
import { getPrioritiesDdl } from '@/services/ddl/priorities.ddl.service'
import { useQuery } from '@tanstack/react-query'

const EMPTY_PRIORITIES_DDL: IDDl[] = []
const CHECKLIST_PRIORITY_QUERY_KEY = ['checklist-priority'] as const

const useGetPriorites = () => {
  const query = useQuery({
    queryKey: CHECKLIST_PRIORITY_QUERY_KEY,
    queryFn: getPrioritiesDdl,
    staleTime: queryTimes.veryLong,
    gcTime: queryTimes.veryLong,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_PRIORITIES_DDL,
  }
}

export default useGetPriorites
