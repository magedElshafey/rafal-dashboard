import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'
import type { LoyaltyAdjustmentPayload } from '@/modules/loyalty/types/loyalty.types'

export function useAdjustCustomerLoyalty(customerId: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    retry: false,
    mutationFn: (payload: LoyaltyAdjustmentPayload) => loyaltyService.adjustCustomerPoints(customerId, payload),
    onSuccess: async (summary) => {
      queryClient.setQueryData(loyaltyKeys.customerSummary(customerId), summary)
      await queryClient.invalidateQueries({
        queryKey: loyaltyKeys.customerLedgers(customerId),
        refetchType: 'active',
      })
      toast.success(t('loyalty.customer.adjustment.feedback.success'))
    },
  })
}
