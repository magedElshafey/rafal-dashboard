import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productsService } from '@/modules/products/api/products.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductCreatePayload } from '@/modules/products/types/product.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (payload: ProductCreatePayload) => productsService.create(payload),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: productsKeys.lists() })
      toast.success(t('products.feedback.created'))
    },
    onError: (error) => toastApiError(error, t('products.feedback.createError')),
  })
}
