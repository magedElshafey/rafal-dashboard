import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { citiesService } from '@/modules/cities/api/cities.service'
import { citiesKeys } from '@/modules/cities/queries/cities.keys'
import { regionsKeys } from '@/modules/regions/queries/regions.keys'

export function useDeleteCity() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => citiesService.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: citiesKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: regionsKeys.lists() }),
      ])
      toast.success(t('cities.feedback.deleted'))
    },
    onError: () => toast.error(t('cities.feedback.deleteError')),
  })
}
