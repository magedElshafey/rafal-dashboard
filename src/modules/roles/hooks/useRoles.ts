import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { rolesService } from '@/modules/roles/api/roles.service'
import { rolesKeys } from '@/modules/roles/queries/roles.keys'

export function useRoles() {
  return useInfinitePaginatedQuery({
    queryKey: rolesKeys.list(),
    queryFn: (page, signal) => rolesService.list(page, signal),
    retry: false,
  })
}
