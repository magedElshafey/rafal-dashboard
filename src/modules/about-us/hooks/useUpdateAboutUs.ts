import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { aboutUsService } from '@/modules/about-us/api/about-us.service'
import { aboutUsKeys } from '@/modules/about-us/queries/about-us.keys'
import type { AboutUsUpdatePayload } from '@/modules/about-us/types/about-us.types'

export function useUpdateAboutUs() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: AboutUsUpdatePayload) => aboutUsService.update(payload),
    onSuccess: (aboutUs) => {
      queryClient.setQueryData(aboutUsKeys.detail(), aboutUs)
      toast.success(t('aboutUs.feedback.updated'))
    },
    onError: () => toast.error(t('aboutUs.feedback.updateError')),
  })
}
