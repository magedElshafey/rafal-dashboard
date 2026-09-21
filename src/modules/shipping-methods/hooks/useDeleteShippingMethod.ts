import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { shippingMethodsService } from '@/modules/shipping-methods/api/shipping-methods.service'
import { shippingMethodsKeys } from '@/modules/shipping-methods/queries/shipping-methods.keys'

export function useDeleteShippingMethod() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => shippingMethodsService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shippingMethodsKeys.lists() })
      toast.success(t('shippingMethods.feedback.deleted'))
    },
    onError: () => toast.error(t('shippingMethods.feedback.deleteError')),
  })
}
