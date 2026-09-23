import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productsService } from '@/modules/products/api/products.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductUpdatePayload } from '@/modules/products/types/product.types'

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: ProductUpdatePayload) => productsService.update(id, payload),
    onSuccess: async (product) => {
      queryClient.setQueryData(productsKeys.detail(product.id), product)
      await queryClient.invalidateQueries({ queryKey: productsKeys.lists() })
      toast.success(t('products.feedback.updated'))
    },
    onError: () => toast.error(t('products.feedback.updateError')),
  })
}
