import { queryTimes } from '@/lib/react-query/query-times'
import { getExtensionsRequestReasons } from '@/services/ddl/getExtensionsRequestReasons.service'
import { useQuery } from '@tanstack/react-query'

const EMPTY_EXTENSIONS_REASONS_DDL: IDDl[] = []
const EXTENSIONS_REASONS_QUERY_KEY = ['extension-reasons'] as const

type UseGetExtensionsReasonsOptions = {
  enabled?: boolean
}

const useGetExtensionsReasons = ({ enabled = true }: UseGetExtensionsReasonsOptions = {}) => {
  const query = useQuery({
    queryKey: EXTENSIONS_REASONS_QUERY_KEY,
    queryFn: getExtensionsRequestReasons,
    staleTime: queryTimes.veryLong,
    gcTime: queryTimes.veryLong,
    enabled,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_EXTENSIONS_REASONS_DDL,
  }
}

export default useGetExtensionsReasons
