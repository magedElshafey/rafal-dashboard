import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { bannersService } from '@/modules/banners/api/banners.service'
import { bannersKeys } from '@/modules/banners/queries/banners.keys'

export function useDeleteBanner() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => bannersService.delete(id),
    onSuccess: async (_response, id) => {
      queryClient.removeQueries({ queryKey: bannersKeys.detail(id), exact: true })
      await queryClient.invalidateQueries({ queryKey: bannersKeys.lists() })
      toast.success(t('banners.feedback.deleted'))
    },
    onError: () => toast.error(t('banners.feedback.deleteError')),
  })
}
