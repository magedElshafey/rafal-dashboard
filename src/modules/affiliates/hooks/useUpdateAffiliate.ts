import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getQueryClientAuthBoundaryEpoch } from '@/lib/react-query/query-client'
import { affiliatesService } from '../api/affiliates.service'
import { affiliatesKeys } from '../queries/affiliates.keys'
import type { UpdateAffiliatePayload } from '../types/affiliate.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
export function useUpdateAffiliate(id: number) {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    retry: false,
    onMutate: () => getQueryClientAuthBoundaryEpoch(),
    mutationFn: (payload: UpdateAffiliatePayload) => affiliatesService.update(id, payload),
    onSuccess: async (_result, _payload, epoch) => {
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      await Promise.all([
        client.cancelQueries({ queryKey: affiliatesKeys.detail(id) }),
        client.cancelQueries({ queryKey: affiliatesKeys.lists() }),
      ])
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      await Promise.all([
        client.invalidateQueries({ queryKey: affiliatesKeys.detail(id) }),
        client.invalidateQueries({ queryKey: affiliatesKeys.lists() }),
      ])
      if (epoch === getQueryClientAuthBoundaryEpoch()) toast.success(t('affiliates.feedback.updated'))
    },
    onError: (error, _payload, epoch) => {
      if (epoch === getQueryClientAuthBoundaryEpoch()) toastApiError(error, t('affiliates.feedback.updateError'), true)
    },
  })
}
