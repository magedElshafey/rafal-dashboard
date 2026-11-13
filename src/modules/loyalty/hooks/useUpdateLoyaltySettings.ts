import { isAxiosError } from 'axios'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'
import type { LoyaltySettingsUpdatePayload } from '@/modules/loyalty/types/loyalty.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useUpdateLoyaltySettings() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (payload: LoyaltySettingsUpdatePayload) => loyaltyService.updateSettings(payload),
    onSuccess: async (settings) => {
      queryClient.setQueryData(loyaltyKeys.settings(), settings)
      await queryClient.invalidateQueries({ queryKey: loyaltyKeys.histories(), refetchType: 'active' })
      toast.success(t('loyalty.feedback.updated'))
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 409) return
      toastApiError(error, t('loyalty.feedback.updateError'))
    },
  })
}
