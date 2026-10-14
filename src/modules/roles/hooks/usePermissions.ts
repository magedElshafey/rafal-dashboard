import { queryTimes } from '@/lib/react-query/query-times'
import { useQuery } from '@tanstack/react-query'
import { permissionsService } from '@/modules/roles/api/permissions.service'
import { permissionsKeys } from '@/modules/roles/queries/permissions.keys'

export function usePermissions() {
  return useQuery({
    queryKey: permissionsKeys.list(),
    queryFn: ({ signal }) => permissionsService.list(signal),
    retry: false,
    retryOnMount: false,
    staleTime: queryTimes.short,
  })
}
