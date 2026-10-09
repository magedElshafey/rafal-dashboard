import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { rolesService } from '@/modules/roles/api/roles.service'
import { rolesKeys } from '@/modules/roles/queries/roles.keys'
import type { RolesFilters } from '@/modules/roles/types/role.types'
import { emptyRolesFilters } from '@/modules/roles/utils/role-filters'

export function useRoles(filters: RolesFilters = emptyRolesFilters) {
  return useInfinitePaginatedQuery({
    queryKey: rolesKeys.list(filters),
    queryFn: (page, signal) => rolesService.list(page, signal, filters),
    retry: false,
  })
}
