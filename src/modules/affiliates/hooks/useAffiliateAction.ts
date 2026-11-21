import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { affiliatesService } from '@/modules/affiliates/api/affiliates.service'
import { affiliatesKeys } from '@/modules/affiliates/queries/affiliates.keys'
import type { Affiliate, AffiliatePasswordReset } from '@/modules/affiliates/types/affiliate.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export type AffiliateManagementAction = 'suspend' | 'reactivate' | 'resetPassword'

export function isAffiliateStatusConflict(error: unknown) {
  return (
    isAxiosError(error) &&
    error.response?.status === 409 &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'code' in error.response.data &&
    error.response.data.code === 'AFFILIATE_STATUS_CONFLICT'
  )
}

export function useAffiliateAction(id: number, action: AffiliateManagementAction) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation<Affiliate | AffiliatePasswordReset, unknown, void>({
    retry: false,
    mutationFn: () => {
      if (action === 'suspend') return affiliatesService.suspend(id)
      if (action === 'reactivate') return affiliatesService.reactivate(id)
      return affiliatesService.resetPassword(id)
    },
    onSuccess: async (result) => {
      if (action !== 'resetPassword') queryClient.setQueryData(affiliatesKeys.detail(id), result as Affiliate)
      await Promise.all([
        ...(action === 'resetPassword' ? [] : [queryClient.invalidateQueries({ queryKey: affiliatesKeys.lists() })]),
        queryClient.invalidateQueries({ queryKey: affiliatesKeys.activity(id), exact: true }),
      ])
      toast.success(t(`affiliates.feedback.${action}`))
    },
    onError: async (error) => {
      if (action !== 'resetPassword' && isAffiliateStatusConflict(error)) {
        toast.error(t('affiliates.feedback.statusConflict'))
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: affiliatesKeys.detail(id), exact: true }),
          queryClient.invalidateQueries({ queryKey: affiliatesKeys.lists() }),
        ])
        return
      }
      toastApiError(error, t(`affiliates.feedback.${action}Error`))
    },
  })
}
