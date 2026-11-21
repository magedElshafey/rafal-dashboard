import { useQuery } from '@tanstack/react-query'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'

export function useAffiliate(id: number | null) {
  return useQuery({
    queryKey: affiliatesKeys.detail(id ?? 0),
    queryFn: ({ signal }) => affiliatesService.show(id as number, signal),
    enabled: id !== null,
    retry: false,
  })
}
