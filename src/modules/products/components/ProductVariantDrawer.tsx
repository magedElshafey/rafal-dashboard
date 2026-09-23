import { useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { EMPTY_PRODUCT_VARIANT_FORM, ProductVariantForm } from '@/modules/products/components/ProductVariantForm'
import { useCreateProductVariant } from '@/modules/products/hooks/useCreateProductVariant'
import type { ProductVariantFormValues } from '@/modules/products/types/product-variant.types'
import { buildProductVariantCreatePayload } from '@/modules/products/utils/product-variant.utils'

const FORM_ID = 'product-variant-form'

type Props = { productId: number; open: boolean; onOpenChange: (open: boolean) => void }

export function ProductVariantDrawer({ productId, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const createVariant = useCreateProductVariant(productId)
  const lockRef = useRef(false)

  const handleSubmit = async (values: ProductVariantFormValues, methods: UseFormReturn<ProductVariantFormValues>) => {
    if (lockRef.current) return
    lockRef.current = true
    try {
      await createVariant.mutateAsync(buildProductVariantCreatePayload(values))
      methods.reset(EMPTY_PRODUCT_VARIANT_FORM)
      onOpenChange(false)
    } finally {
      lockRef.current = false
    }
  }

  return (
    <EntityFormDrawer
      open={open}
      mode="create"
      onOpenChange={onOpenChange}
      titles={{ create: t('products.variants.createTitle') }}
      descriptions={{ create: t('products.variants.createDescription') }}
      submitLabels={{ create: t('products.variants.actions.create') }}
      cancelLabel={t('products.actions.cancel')}
      closeLabel={t('products.variants.actions.close')}
      formId={FORM_ID}
      isSubmitting={createVariant.isPending}
    >
      <ProductVariantForm
        key={open ? 'open' : 'closed'}
        formId={FORM_ID}
        isSubmitting={createVariant.isPending}
        onSubmit={handleSubmit}
      />
    </EntityFormDrawer>
  )
}
