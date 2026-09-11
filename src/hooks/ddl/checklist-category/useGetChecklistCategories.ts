import { queryTimes } from '@/lib/react-query/query-times'
import { getCheckListCategoriesDdl } from '@/services/ddl/checklist-categories.ddl.service'
import { useQuery } from '@tanstack/react-query'

const EMPTY_CATEGORIES_DDL: IDDl[] = []
const CHECKLIST_CATEGORIES_QUERY_KEY = ['checklist-categories'] as const

const useGetChecklistCategories = () => {
  const query = useQuery({
    queryKey: CHECKLIST_CATEGORIES_QUERY_KEY,
    queryFn: getCheckListCategoriesDdl,
    staleTime: queryTimes.veryLong,
    gcTime: queryTimes.veryLong,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_CATEGORIES_DDL,
  }
}

export default useGetChecklistCategories
