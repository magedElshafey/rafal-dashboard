import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'
import type { UpdateAffiliatePayload } from '@/modules/affiliates/types/affiliate.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useUpdateAffiliate(id: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    retry: false,
    mutationFn: (payload: UpdateAffiliatePayload) => affiliatesService.update(id, payload),
    onSuccess: async (affiliate) => {
      queryClient.setQueryData(affiliatesKeys.detail(id), affiliate)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: affiliatesKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: affiliatesKeys.activity(id), exact: true }),
      ])
      toast.success(t('affiliates.feedback.updated'))
    },
    onError: (error) => toastApiError(error, t('affiliates.feedback.updateError')),
  })
}
