import { useQuery } from '@tanstack/react-query'

import { rolesService } from '@/modules/roles/api/roles.service'
import { rolesKeys } from '@/modules/roles/queries/roles.keys'

export function useRole(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: rolesKeys.detail(id ?? 0),
    queryFn: ({ signal }) => rolesService.show(id as number, signal),
    enabled: enabled && id !== null,
    staleTime: 0,
  })
}
