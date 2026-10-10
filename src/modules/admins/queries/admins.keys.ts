import type { AdminsFilters } from '../types/admin.types'
import { emptyAdminsFilters } from '../utils/admin-filters'

export const adminsKeys = {
  all: ['admins'] as const,
  lists: () => [...adminsKeys.all, 'list'] as const,
  list: (filters: AdminsFilters = emptyAdminsFilters) => [...adminsKeys.lists(), filters] as const,
  details: () => [...adminsKeys.all, 'detail'] as const,
  detail: (id: number) => [...adminsKeys.details(), id] as const,
}
