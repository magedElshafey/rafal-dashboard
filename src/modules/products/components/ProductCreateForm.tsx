import { useMemo, useRef } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { Path, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { FormWrapper } from '@/components/core/FormWrapper'
import { Button } from '@/components/ui/button'
import { ProductCreateVariantsFields } from '@/modules/products/components/ProductCreateVariantsFields'
import { ProductFormSections } from '@/modules/products/components/ProductFormSections'
import { createProductCreateSchema } from '@/modules/products/schemas/product-create.schema'
import type { ProductCreateFormValues, ProductCreatePayload } from '@/modules/products/types/product.types'
import {
  buildProductCreatePayload,
  createEmptyProductCreateFormValues,
} from '@/modules/products/utils/product-create.utils'
import { normalizeVariantAttributeKey } from '@/modules/products/utils/product-variant.utils'
import { Routes } from '@/routes/routes'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

type ProductCreateFormProps = {
  isSubmitting: boolean
  onSubmit: (payload: ProductCreatePayload) => Promise<unknown>
}

export const EMPTY_PRODUCT_CREATE_FORM_VALUES = createEmptyProductCreateFormValues()

export const PRODUCT_CREATE_API_FIELD_ALIASES = {
  category_id: 'categoryId',
  sku: 'sku',
  'name.ar': 'name.ar',
  'name.en': 'name.en',
  'description.ar': 'description.ar',
  'description.en': 'description.en',
  base_price: 'basePrice',
  discount_percentage: 'discountPercentage',
  discount_end_at: 'discountEndAt',
  is_personalizable: 'isPersonalizable',
  personalization_max_length: 'personalizationMaxLength',
  personalization_fee: 'personalizationFee',
  hide_price_on_packaging: 'hidePriceOnPackaging',
  is_new_arrival: 'isNewArrival',
  is_active: 'isActive',
  sort_order: 'sortOrder',
  images: 'images',
  'images.*': 'images',
} as const

function buildProductCreateApiFieldAliases(values: ProductCreateFormValues) {
  const aliases: Record<string, Path<ProductCreateFormValues>> = { ...PRODUCT_CREATE_API_FIELD_ALIASES }
  values.variants.forEach((variant, variantIndex) => {
    aliases[`variants.${variantIndex}.price_override`] = `variants.${variantIndex}.priceOverride`
    aliases[`variants.${variantIndex}.is_active`] = `variants.${variantIndex}.isActive`
    variant.attributes.forEach((attribute, attributeIndex) => {
      const key = normalizeVariantAttributeKey(attribute.key)
      if (key) {
        aliases[`variants.${variantIndex}.attributes.${key}`] =
          `variants.${variantIndex}.attributes.${attributeIndex}.value`
      }
    })
    variant.stocks.forEach((_stock, stockIndex) => {
      aliases[`variants.${variantIndex}.stocks.${stockIndex}.warehouse_id`] =
        `variants.${variantIndex}.stocks.${stockIndex}.warehouseId`
    })
  })
  return aliases
}

export function ProductCreateForm({ isSubmitting, onSubmit }: ProductCreateFormProps) {
  const { t } = useTranslation()
  const submissionLockRef = useRef(false)
  const schema = useMemo(
    () =>
      createProductCreateSchema({
        required: t('products.validation.required'),
        validNumber: t('products.validation.validNumber'),
        nonNegative: t('products.validation.nonNegative'),
        integer: t('products.validation.integer'),
        minimumOne: t('products.validation.minimumOne'),
        discountRange: t('products.validation.discountRange'),
        maxLength: t('products.validation.maxLength'),
        dateInvalid: t('products.validation.dateInvalid'),
        imageType: t('products.validation.imageType'),
        imageSize: t('products.validation.imageSize'),
        imageRequired: t('products.validation.imageRequired'),
        variantRequired: t('products.validation.variantRequired'),
        duplicateVariantSku: t('products.validation.duplicateVariantSku'),
        attributeIncomplete: t('products.variants.validation.attributeIncomplete'),
        attributeDuplicate: t('products.variants.validation.attributeDuplicate'),
        attributeInvalidKey: t('products.variants.validation.attributeInvalidKey'),
        attributeInvalidColor: t('products.variants.validation.attributeInvalidColor'),
        duplicateWarehouse: t('products.validation.duplicateWarehouse'),
      }),
    [t]
  )

  const handleSubmit = async (values: ProductCreateFormValues, methods: UseFormReturn<ProductCreateFormValues>) => {
    if (submissionLockRef.current) return
    submissionLockRef.current = true
    try {
      await onSubmit(buildProductCreatePayload(values))
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, buildProductCreateApiFieldAliases(values))
    } finally {
      submissionLockRef.current = false
    }
  }

  return (
    <FormWrapper<ProductCreateFormValues>
      schema={schema}
      defaultValues={EMPTY_PRODUCT_CREATE_FORM_VALUES}
      submissionDisabled={isSubmitting}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <ProductFormSections isSubmitting={isSubmitting} requireImages />
      <ProductCreateVariantsFields />
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button asChild variant="outline" size="lg">
          <Link to={Routes.products}>{t('products.actions.cancel')}</Link>
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {isSubmitting ? t('products.actions.creating') : t('products.actions.create')}
        </Button>
      </div>
    </FormWrapper>
  )
}
