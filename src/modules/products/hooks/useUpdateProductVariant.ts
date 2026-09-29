import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productVariantsService } from '@/modules/products/api/product-variants.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductVariantUpdatePayload } from '@/modules/products/types/product-variant.types'
import type { ProductDetail } from '@/modules/products/types/product.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useUpdateProductVariant(productId: number, variantId: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: ProductVariantUpdatePayload) => productVariantsService.update(productId, variantId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<ProductDetail>(productsKeys.detail(productId), (product) =>
        product
          ? {
              ...product,
              variants: product.variants.map((variant) => (variant.id === variantId ? updated : variant)),
            }
          : product
      )
      toast.success(t('products.variants.feedback.updated'))
    },
    onError: (error) => toastApiError(error, t('products.variants.feedback.updateError')),
  })
}
