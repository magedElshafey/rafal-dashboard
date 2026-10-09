import type { RolesFilters } from '@/modules/roles/types/role.types'
import { emptyRolesFilters } from '@/modules/roles/utils/role-filters'

export const rolesKeys = {
  all: ['roles'] as const,
  lists: () => [...rolesKeys.all, 'list'] as const,
  list: (filters: RolesFilters = emptyRolesFilters) => [...rolesKeys.lists(), filters] as const,
  details: () => [...rolesKeys.all, 'detail'] as const,
  detail: (id: number) => [...rolesKeys.details(), id] as const,
}
