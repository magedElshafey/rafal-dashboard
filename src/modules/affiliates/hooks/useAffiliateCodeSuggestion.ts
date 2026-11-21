import { useQuery } from '@tanstack/react-query'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'

export function useAffiliateCodeSuggestion(enabled: boolean) {
  return useQuery({
    queryKey: affiliatesKeys.suggestion(),
    queryFn: ({ signal }) => affiliatesService.suggestCode(signal),
    enabled,
    staleTime: 0,
    retry: false,
    refetchOnMount: 'always',
  })
}
