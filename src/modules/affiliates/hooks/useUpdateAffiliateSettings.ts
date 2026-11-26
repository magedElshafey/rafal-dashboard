import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getQueryClientAuthBoundaryEpoch } from '@/lib/react-query/query-client'
import { affiliatesService } from '../api/affiliates.service'
import { affiliatesKeys } from '../queries/affiliates.keys'
import type { UpdateAffiliateSettingsPayload } from '../types/affiliate.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
export function useUpdateAffiliateSettings() {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    retry: false,
    onMutate: () => getQueryClientAuthBoundaryEpoch(),
    mutationFn: (payload: UpdateAffiliateSettingsPayload) => affiliatesService.updateSettings(payload),
    onSuccess: async (result, _payload, epoch) => {
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      await client.cancelQueries({ queryKey: affiliatesKeys.settings(), exact: true })
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      client.setQueryData(affiliatesKeys.settings(), result)
      toast.success(t('affiliates.settings.feedback.updated'))
    },
    onError: (error, _payload, epoch) => {
      if (epoch === getQueryClientAuthBoundaryEpoch())
        toastApiError(error, t('affiliates.settings.feedback.updateError'), true)
    },
  })
}
