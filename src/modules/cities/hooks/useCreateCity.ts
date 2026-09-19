import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { citiesService } from '@/modules/cities/api/cities.service'
import { citiesKeys } from '@/modules/cities/queries/cities.keys'
import type { CityPayload } from '@/modules/cities/types/city.types'
import { regionsKeys } from '@/modules/regions/queries/regions.keys'

export function useCreateCity() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: CityPayload) => citiesService.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: citiesKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: regionsKeys.lists() }),
      ])
      toast.success(t('cities.feedback.created'))
    },
    onError: () => toast.error(t('cities.feedback.createError')),
  })
}
