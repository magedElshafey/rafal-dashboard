import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productVariantsService } from '@/modules/products/api/product-variants.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'

export function useDeleteProductVariant(productId: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (variantId: number) => productVariantsService.delete(productId, variantId),
    onSuccess: async (_response, variantId) => {
      queryClient.setQueryData<ProductDetail>(productsKeys.detail(productId), (product) =>
        product ? { ...product, variants: product.variants.filter((variant) => variant.id !== variantId) } : product
      )
      await queryClient.invalidateQueries({ queryKey: productsKeys.lists() })
      toast.success(t('products.variants.feedback.deleted'))
    },
    onError: () => toast.error(t('products.variants.feedback.deleteError')),
  })
}
