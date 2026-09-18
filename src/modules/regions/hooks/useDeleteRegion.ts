import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { regionsService } from '@/modules/regions/api/regions.service'
import { regionsKeys } from '@/modules/regions/queries/regions.keys'

export function useDeleteRegion() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => regionsService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: regionsKeys.lists() })
      toast.success(t('regions.feedback.deleted'))
    },
    onError: () => toast.error(t('regions.feedback.deleteError')),
  })
}
