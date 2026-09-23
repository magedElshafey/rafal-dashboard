import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productMediaService } from '@/modules/products/api/product-media.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'

export type ProductVariantMediaTarget = { variantId: number; mediaId: number }

export function useDeleteProductVariantMedia(productId: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ mediaId }: ProductVariantMediaTarget) => productMediaService.delete(mediaId),
    onSuccess: (_response, target) => {
      queryClient.setQueryData<ProductDetail>(productsKeys.detail(productId), (product) =>
        product
          ? {
              ...product,
              variants: product.variants.map((variant) =>
                variant.id === target.variantId
                  ? { ...variant, images: variant.images.filter((image) => image.id !== target.mediaId) }
                  : variant
              ),
            }
          : product
      )
      toast.success(t('products.variants.feedback.imageDeleted'))
    },
    onError: () => toast.error(t('products.variants.feedback.imageDeleteError')),
  })
}
