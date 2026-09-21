import { useQuery } from '@tanstack/react-query'

import { settingsService } from '@/modules/settings/api/settings.service'
import { settingsKeys } from '@/modules/settings/queries/settings.keys'

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: ({ signal }) => settingsService.get(signal),
    retry: false,
  })
}
