import { useQuery } from '@tanstack/react-query'

import { queryTimes } from '@/lib/react-query/query-times'
import { getAdminsDdl } from '@/services/ddl/admins.ddl.service'

import { adminsDdlQueryKeys } from './admins-ddl.query-keys'

const EMPTY_ADMINS_DDL: IDDl[] = []

export function useAdminsDdl(enabled = true) {
  const query = useQuery({
    queryKey: adminsDdlQueryKeys.all,
    queryFn: getAdminsDdl,
    enabled,
    staleTime: queryTimes.long,
    gcTime: queryTimes.long,
  })

  return {
    ...query,
    data: query.data ?? EMPTY_ADMINS_DDL,
  }
}
