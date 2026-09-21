import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { shippingMethodsService } from '@/modules/shipping-methods/api/shipping-methods.service'
import { shippingMethodsKeys } from '@/modules/shipping-methods/queries/shipping-methods.keys'
import type { ShippingMethodUpdatePayload } from '@/modules/shipping-methods/types/shipping-method.types'

export function useUpdateShippingMethod(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: ShippingMethodUpdatePayload) => {
      if (id === null) throw new Error('Cannot update a Shipping Method without an ID')
      return shippingMethodsService.update(id, payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shippingMethodsKeys.lists() })
      toast.success(t('shippingMethods.feedback.updated'))
    },
    onError: () => toast.error(t('shippingMethods.feedback.updateError')),
  })
}
