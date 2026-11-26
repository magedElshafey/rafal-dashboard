import type { AffiliatePasswordReset } from '../types/affiliate.types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getQueryClientAuthBoundaryEpoch } from '@/lib/react-query/query-client'
import { affiliatesService } from '../api/affiliates.service'
import { affiliatesKeys } from '../queries/affiliates.keys'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'
export type AffiliateManagementAction = 'suspend' | 'reactivate' | 'resetPassword'
export function isAffiliateStatusConflict(error: unknown) {
  return isAxiosError(error) && error.response?.status === 409
}
export function useAffiliateAction(id: number, action: AffiliateManagementAction) {
  const client = useQueryClient()
  const { t } = useTranslation()
  const reconcile = async (epoch: number | undefined) => {
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
  }
  return useMutation<AffiliatePasswordReset | void, unknown, string, number>({
    retry: false,
    onMutate: () => getQueryClientAuthBoundaryEpoch(),
    mutationFn: (reason: string) =>
      action === 'resetPassword' ? affiliatesService.resetPassword(id) : affiliatesService[action](id, reason),
    onSuccess: async (result, _reason, epoch) => {
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      if (action !== 'resetPassword') await reconcile(epoch)
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      if (result && !result.sms_sent) toast.warning(result.sms_message || t('affiliates.feedback.smsFailed'))
      else toast.success(result?.sms_message || t(`affiliates.feedback.${action}`))
    },
    onError: async (error, _reason, epoch) => {
      if (epoch !== getQueryClientAuthBoundaryEpoch()) return
      toastApiError(error, t(`affiliates.feedback.${action}Error`), true)
      if (isAffiliateStatusConflict(error)) await reconcile(epoch)
    },
  })
}
