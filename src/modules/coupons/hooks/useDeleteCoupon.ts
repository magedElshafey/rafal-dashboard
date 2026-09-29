import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { couponsService } from '@/modules/coupons/api/coupons.service'
import { couponsKeys } from '@/modules/coupons/queries/coupons.keys'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useDeleteCoupon() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => couponsService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: couponsKeys.lists() })
      toast.success(t('coupons.feedback.deleted'))
    },
    onError: (error) => toastApiError(error, t('coupons.feedback.deleteError')),
  })
}
