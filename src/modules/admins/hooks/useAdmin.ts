import { useQuery } from '@tanstack/react-query'

import { adminsService } from '@/modules/admins/api/admins.service'
import { adminsKeys } from '@/modules/admins/queries/admins.keys'

export function useAdmin(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: adminsKeys.detail(id ?? 0),
    queryFn: ({ signal }) => adminsService.show(id as number, signal),
    enabled: enabled && id !== null,
    staleTime: 0,
  })
}
