import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productVariantStocksService } from '@/modules/products/api/product-variant-stocks.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import { inventoryKeys } from '@/modules/inventory/queries/inventory.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export type PutProductVariantStockVariables = { variantId: number; warehouseId: number; quantity: number }

export function usePutProductVariantStock(
  productId: number,
  options?: { suppressForbiddenRedirect?: boolean; revalidateProduct?: boolean }
) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: ({ variantId, warehouseId, quantity }: PutProductVariantStockVariables) =>
      options
        ? productVariantStocksService.put(productId, variantId, warehouseId, quantity, options)
        : productVariantStocksService.put(productId, variantId, warehouseId, quantity),
    onSuccess: async (stock, variables) => {
      if (options?.revalidateProduct)
        await queryClient.cancelQueries({ queryKey: productsKeys.detail(productId), exact: true })
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
      // Status and update time are backend-owned; never infer them from the submitted quantity.
      await queryClient.cancelQueries({ queryKey: inventoryKeys.all })
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
      if (options?.revalidateProduct)
        await queryClient.invalidateQueries({ queryKey: productsKeys.detail(productId), exact: true })
      toast.success(t('products.variants.stock.feedback.saved'))
    },
    onError: (error) => toastApiError(error, t('products.variants.stock.feedback.saveError')),
  })
}
