import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productMediaService } from '@/modules/products/api/product-media.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'

export function useDeleteProductMedia(productId: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (mediaId: number) => productMediaService.delete(mediaId),
    onSuccess: async (_response, mediaId) => {
      queryClient.setQueryData<ProductDetail>(productsKeys.detail(productId), (product) =>
        product ? { ...product, images: product.images.filter((image) => image.id !== mediaId) } : product
      )
      await queryClient.invalidateQueries({ queryKey: productsKeys.lists() })
      toast.success(t('products.feedback.imageDeleted'))
    },
    onError: () => toast.error(t('products.feedback.imageDeleteError')),
  })
}
