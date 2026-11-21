import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'
import type { CreateAffiliatePayload } from '@/modules/affiliates/types/affiliate.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useCreateAffiliate() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (payload: CreateAffiliatePayload) => affiliatesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: affiliatesKeys.lists() })
      toast.success(t('affiliates.feedback.created'))
    },
    onError: (error) => toastApiError(error, t('affiliates.feedback.createError')),
  })
}
