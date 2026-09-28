import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { couponsService } from '@/modules/coupons/api/coupons.service'
import { couponsKeys } from '@/modules/coupons/queries/coupons.keys'
import type { CouponCreatePayload } from '@/modules/coupons/types/coupon.types'

export function useCreateCoupon() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: CouponCreatePayload) => couponsService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: couponsKeys.lists() })
      toast.success(t('coupons.feedback.created'))
    },
    onError: () => toast.error(t('coupons.feedback.createError')),
  })
}
