import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productVariantStocksService } from '@/modules/products/api/product-variant-stocks.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import { inventoryKeys } from '@/modules/inventory/queries/inventory.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export type DeleteProductVariantStockVariables = { variantId: number; warehouseId: number }

export function useDeleteProductVariantStock(productId: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ variantId, warehouseId }: DeleteProductVariantStockVariables) =>
      productVariantStocksService.delete(productId, variantId, warehouseId),
    onSuccess: async (_response, variables) => {
      queryClient.setQueryData<ProductDetail>(productsKeys.detail(productId), (product) =>
        product
          ? {
              ...product,
              variants: product.variants.map((variant) =>
                variant.id === variables.variantId
                  ? {
                      ...variant,
                      warehouseStocks: variant.warehouseStocks.filter(
                        (stock) => stock.warehouseId !== variables.warehouseId
                      ),
                    }
                  : variant
              ),
            }
          : product
      )
      await queryClient.cancelQueries({ queryKey: inventoryKeys.all })
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
      toast.success(t('products.variants.stock.feedback.deleted'))
    },
    onError: (error) => toastApiError(error, t('products.variants.stock.feedback.deleteError')),
  })
}
