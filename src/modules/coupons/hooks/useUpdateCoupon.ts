import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { couponsService } from '@/modules/coupons/api/coupons.service'
import { couponsKeys } from '@/modules/coupons/queries/coupons.keys'
import type { CouponUpdatePayload } from '@/modules/coupons/types/coupon.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useUpdateCoupon(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: CouponUpdatePayload) => {
      if (id === null) throw new Error('Cannot update a Coupon without an ID')
      return couponsService.update(id, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: couponsKeys.lists() })
      toast.success(t('coupons.feedback.updated'))
    },
    onError: (error) => toastApiError(error, t('coupons.feedback.updateError')),
  })
}
