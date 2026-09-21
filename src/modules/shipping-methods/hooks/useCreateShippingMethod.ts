import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { shippingMethodsService } from '@/modules/shipping-methods/api/shipping-methods.service'
import { shippingMethodsKeys } from '@/modules/shipping-methods/queries/shipping-methods.keys'
import type { ShippingMethodCreatePayload } from '@/modules/shipping-methods/types/shipping-method.types'

export function useCreateShippingMethod() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: ShippingMethodCreatePayload) => shippingMethodsService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shippingMethodsKeys.lists() })
      toast.success(t('shippingMethods.feedback.created'))
    },
    onError: () => toast.error(t('shippingMethods.feedback.createError')),
  })
}
