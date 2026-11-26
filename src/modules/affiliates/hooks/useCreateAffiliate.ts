import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getQueryClientAuthBoundaryEpoch } from '@/lib/react-query/query-client'
import { affiliatesService } from '../api/affiliates.service'
import { affiliatesKeys } from '../queries/affiliates.keys'
import type { CreateAffiliatePayload } from '../types/affiliate.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
export function useCreateAffiliate() {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    retry: false,
    onMutate: () => getQueryClientAuthBoundaryEpoch(),
    mutationFn: (payload: CreateAffiliatePayload) => affiliatesService.create(payload),
    onSuccess: async (result, _payload, epoch) => {
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      await client.cancelQueries({ queryKey: affiliatesKeys.lists() })
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      await client.invalidateQueries({ queryKey: affiliatesKeys.lists() })
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      toast.success(t('affiliates.feedback.created'))
      if (!result.sms_sent) toast.warning(result.sms_message || t('affiliates.feedback.smsFailed'))
    },
    onError: (error, _payload, epoch) => {
      if (epoch === getQueryClientAuthBoundaryEpoch()) toastApiError(error, t('affiliates.feedback.createError'), true)
    },
  })
}
