import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { citiesService } from '@/modules/cities/api/cities.service'
import { citiesKeys } from '@/modules/cities/queries/cities.keys'
import type { CityUpdatePayload } from '@/modules/cities/types/city.types'
import { regionsKeys } from '@/modules/regions/queries/regions.keys'

export function useUpdateCity(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: CityUpdatePayload) => {
      if (id === null) throw new Error('Cannot update a City without an ID')
      return citiesService.update(id, payload)
    },
    onSuccess: async (_, payload) => {
      const invalidations = [queryClient.invalidateQueries({ queryKey: citiesKeys.lists() })]
      if (payload.regionId !== undefined) {
        invalidations.push(queryClient.invalidateQueries({ queryKey: regionsKeys.lists() }))
      }
      await Promise.all(invalidations)
      toast.success(t('cities.feedback.updated'))
    },
    onError: () => toast.error(t('cities.feedback.updateError')),
  })
}
