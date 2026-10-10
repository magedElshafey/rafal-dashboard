import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { adminsService } from '@/modules/admins/api/admins.service'
import { adminsKeys } from '@/modules/admins/queries/admins.keys'
import type { AdminsFilters } from '@/modules/admins/types/admin.types'
import { emptyAdminsFilters } from '@/modules/admins/utils/admin-filters'

export function useAdmins(filters: AdminsFilters = emptyAdminsFilters) {
  return useInfinitePaginatedQuery({
    queryKey: adminsKeys.list(filters),
    queryFn: (page, signal) => adminsService.list(page, signal, filters),
    retry: false,
  })
}
