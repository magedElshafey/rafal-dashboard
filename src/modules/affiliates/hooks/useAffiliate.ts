import { useAffiliateAccess } from '../config/affiliate-access'
import { useQuery } from '@tanstack/react-query'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'

export function useAffiliate(
  id: number | null,
  range: { from?: string; to?: string; orders_page?: number; payouts_page?: number } = {}
) {
  const allowed = useAffiliateAccess('view')
  return useQuery({
    queryKey: affiliatesKeys.period(id ?? 0, range),
    queryFn: ({ signal }) => affiliatesService.show(id as number, signal, range),
    enabled: allowed && id !== null,
    retry: false,
  })
}
