import { useQuery } from '@tanstack/react-query'

import { bannersService } from '@/modules/banners/api/banners.service'
import { bannersKeys } from '@/modules/banners/queries/banners.keys'

export function useBanner(id: number | null, enabled: boolean) {
  return useQuery({
    queryKey: bannersKeys.detail(id ?? 0),
    queryFn: ({ signal }) => bannersService.show(id as number, signal),
    enabled: enabled && id !== null,
    staleTime: 0,
    retry: false,
  })
}
