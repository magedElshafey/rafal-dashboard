import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { regionsService } from '@/modules/regions/api/regions.service'
import { regionsKeys } from '@/modules/regions/queries/regions.keys'
import type { RegionPayload } from '@/modules/regions/types/region.types'

export function useUpdateRegion(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: RegionPayload) => regionsService.update(id as number, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: regionsKeys.lists() })
      toast.success(t('regions.feedback.updated'))
    },
    onError: () => toast.error(t('regions.feedback.updateError')),
  })
}
