import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { bannersService } from '@/modules/banners/api/banners.service'
import { bannersKeys } from '@/modules/banners/queries/banners.keys'
import type { BannerPayload } from '@/modules/banners/types/banner.types'

export function useCreateBanner() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: BannerPayload) => bannersService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: bannersKeys.lists() })
      toast.success(t('banners.feedback.created'))
    },
    onError: () => toast.error(t('banners.feedback.createError')),
  })
}
