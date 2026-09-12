import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { adminsService } from '@/modules/admins/api/admins.service'
import { adminsKeys } from '@/modules/admins/queries/admins.keys'

export function useAdmins() {
  return useInfinitePaginatedQuery({
    queryKey: adminsKeys.list(),
    queryFn: (page, signal) => adminsService.list(page, signal),
    retry: false,
  })
}
