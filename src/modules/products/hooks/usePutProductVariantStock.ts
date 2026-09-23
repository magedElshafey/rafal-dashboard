import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productVariantStocksService } from '@/modules/products/api/product-variant-stocks.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'

export type PutProductVariantStockVariables = { variantId: number; warehouseId: number; quantity: number }

export function usePutProductVariantStock(productId: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ variantId, warehouseId, quantity }: PutProductVariantStockVariables) =>
      productVariantStocksService.put(productId, variantId, warehouseId, quantity),
    onSuccess: (stock, variables) => {
      queryClient.setQueryData<ProductDetail>(productsKeys.detail(productId), (product) =>
        product
          ? {
              ...product,
              variants: product.variants.map((variant) => {
                if (variant.id !== variables.variantId) return variant
                const exists = variant.warehouseStocks.some((item) => item.warehouseId === stock.warehouseId)
                return {
                  ...variant,
                  warehouseStocks: exists
                    ? variant.warehouseStocks.map((item) => (item.warehouseId === stock.warehouseId ? stock : item))
                    : [...variant.warehouseStocks, stock],
                }
              }),
            }
          : product
      )
      toast.success(t('products.variants.stock.feedback.saved'))
    },
    onError: () => toast.error(t('products.variants.stock.feedback.saveError')),
  })
}
