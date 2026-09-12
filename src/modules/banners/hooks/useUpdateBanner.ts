import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { bannersService } from '@/modules/banners/api/banners.service'
import { bannersKeys } from '@/modules/banners/queries/banners.keys'
import type { BannerPayload } from '@/modules/banners/types/banner.types'

export function useUpdateBanner(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: BannerPayload) => bannersService.update(id as number, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(bannersKeys.detail(response.data.id), response)
      await queryClient.invalidateQueries({ queryKey: bannersKeys.lists() })
      toast.success(t('banners.feedback.updated'))
    },
    onError: () => toast.error(t('banners.feedback.updateError')),
  })
}
