import { useAffiliateAccess } from '../config/affiliate-access'
import { useQuery } from '@tanstack/react-query'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'

export function useAffiliateSettings() {
  const allowed = useAffiliateAccess('settingsRead')
  return useQuery({
    queryKey: affiliatesKeys.settings(),
    queryFn: ({ signal }) => affiliatesService.getSettings(signal),
    enabled: allowed,
    retry: false,
  })
}
