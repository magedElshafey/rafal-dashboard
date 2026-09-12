import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { permissionsService } from '@/modules/roles/api/permissions.service'
import { permissionsKeys } from '@/modules/roles/queries/permissions.keys'

export function usePermissions() {
  return useInfinitePaginatedQuery({
    queryKey: permissionsKeys.list(),
    queryFn: (page, signal) => permissionsService.list(page, signal),
    retry: false,
  })
}
