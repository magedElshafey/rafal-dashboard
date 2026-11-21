import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'
import type { UpdateAffiliateSettingsPayload } from '@/modules/affiliates/types/affiliate.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function isAffiliateSettingsVersionConflict(error: unknown) {
  return (
    isAxiosError(error) &&
    error.response?.status === 409 &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'code' in error.response.data &&
    error.response.data.code === 'AFFILIATE_SETTINGS_VERSION_CONFLICT'
  )
}

export function useUpdateAffiliateSettings() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    retry: false,
    mutationFn: (payload: UpdateAffiliateSettingsPayload) => affiliatesService.updateSettings(payload),
    onSuccess: (settings) => {
      queryClient.setQueryData(affiliatesKeys.settings(), settings)
      toast.success(t('affiliates.settings.feedback.updated'))
    },
    onError: (error) => {
      if (isAffiliateSettingsVersionConflict(error)) return
      toastApiError(error, t('affiliates.settings.feedback.updateError'))
    },
  })
}
