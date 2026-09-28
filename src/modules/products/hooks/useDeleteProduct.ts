import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { productsService } from '@/modules/products/api/products.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import { isProductVariantDeleteConflict } from '@/modules/products/utils/product-error.utils'

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => productsService.delete(id),
    onSuccess: async (_response, id) => {
      queryClient.removeQueries({ queryKey: productsKeys.detail(id), exact: true })
      await queryClient.invalidateQueries({ queryKey: productsKeys.lists() })
      toast.success(t('products.feedback.deleted'))
    },
    onError: (error) =>
      toast.error(
        t(
          isProductVariantDeleteConflict(error)
            ? 'products.feedback.deleteVariantConflict'
            : 'products.feedback.deleteError'
        )
      ),
  })
}
