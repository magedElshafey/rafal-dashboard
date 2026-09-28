import { useMemo, useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { EMPTY_PRODUCT_VARIANT_FORM, ProductVariantForm } from '@/modules/products/components/ProductVariantForm'
import { useCreateProductVariant } from '@/modules/products/hooks/useCreateProductVariant'
import { useUpdateProductVariant } from '@/modules/products/hooks/useUpdateProductVariant'
import type { ProductVariant, ProductVariantFormValues } from '@/modules/products/types/product-variant.types'
import {
  buildProductVariantCreatePayload,
  buildProductVariantUpdatePayload,
  getVariantAttributesPresentation,
  productVariantToFormValues,
} from '@/modules/products/utils/product-variant.utils'

const FORM_ID = 'product-variant-form'

type Props = { productId: number; open: boolean; variant: ProductVariant | null; onOpenChange: (open: boolean) => void }

export function ProductVariantDrawer({ productId, open, variant, onOpenChange }: Props) {
  const { t } = useTranslation()
  const createVariant = useCreateProductVariant(productId)
  const updateVariant = useUpdateProductVariant(productId, variant?.id ?? 0)
  const lockRef = useRef(false)
  const mode = variant ? 'edit' : 'create'
  const initialValues = useMemo(
    () => (variant ? productVariantToFormValues(variant) : EMPTY_PRODUCT_VARIANT_FORM),
    [variant]
  )
  const attributes = variant ? getVariantAttributesPresentation(variant.attributes) : null

  const handleSubmit = async (values: ProductVariantFormValues, methods: UseFormReturn<ProductVariantFormValues>) => {
    if (lockRef.current) return
    lockRef.current = true
    try {
      if (variant) await updateVariant.mutateAsync(buildProductVariantUpdatePayload(values, variant))
      else await createVariant.mutateAsync(buildProductVariantCreatePayload(values))
      methods.reset(initialValues)
      onOpenChange(false)
    } finally {
      lockRef.current = false
    }
  }

  return (
    <EntityFormDrawer
      open={open}
      mode={mode}
      onOpenChange={onOpenChange}
      titles={{ create: t('products.variants.createTitle'), edit: t('products.variants.editTitle') }}
      descriptions={{
        create: t('products.variants.createDescription'),
        edit: t('products.variants.editDescription'),
      }}
      submitLabels={{ create: t('products.variants.actions.create'), edit: t('products.variants.actions.update') }}
      cancelLabel={t('products.actions.cancel')}
      closeLabel={t('products.variants.actions.close')}
      formId={FORM_ID}
      isSubmitting={createVariant.isPending || updateVariant.isPending}
    >
      <ProductVariantForm
        key={`${mode}-${variant?.id ?? 'new'}-${open ? 'open' : 'closed'}`}
        formId={FORM_ID}
        isSubmitting={createVariant.isPending || updateVariant.isPending}
        defaultValues={initialValues}
        lockedAttributeCount={attributes?.kind === 'flat' ? attributes.entries.length : 0}
        hasComplexAttributes={attributes?.kind === 'complex'}
        onSubmit={handleSubmit}
      />
    </EntityFormDrawer>
  )
}
