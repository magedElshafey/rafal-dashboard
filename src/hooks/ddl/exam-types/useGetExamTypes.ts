import { queryTimes } from '@/lib/react-query/query-times'
import { getExamTypesDdl } from '@/services/ddl/exam-types.ddl.service'
import { useQuery } from '@tanstack/react-query'

const EXAM_TYPES_DDL: IDDl[] = []
const EXAM_TYPES_QUERY_KEY = ['exam-types'] as const

const useGetExamTypes = () => {
  const query = useQuery({
    queryKey: EXAM_TYPES_QUERY_KEY,
    queryFn: getExamTypesDdl,
    staleTime: queryTimes.veryLong,
    gcTime: queryTimes.veryLong,
  })

  return {
    ...query,
    data: query.data ?? EXAM_TYPES_DDL,
  }
}

export default useGetExamTypes
