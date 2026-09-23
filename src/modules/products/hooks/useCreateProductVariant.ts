import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productVariantsService } from '@/modules/products/api/product-variants.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductVariantCreatePayload } from '@/modules/products/types/product-variant.types'
import type { ProductDetail } from '@/modules/products/types/product.types'

export function useCreateProductVariant(productId: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: ProductVariantCreatePayload) => productVariantsService.create(productId, payload),
    onSuccess: async (variant) => {
      queryClient.setQueryData<ProductDetail>(productsKeys.detail(productId), (product) =>
        product ? { ...product, variants: [...product.variants, variant] } : product
      )
      await queryClient.invalidateQueries({ queryKey: productsKeys.lists() })
      toast.success(t('products.variants.feedback.created'))
    },
    onError: () => toast.error(t('products.variants.feedback.createError')),
  })
}
