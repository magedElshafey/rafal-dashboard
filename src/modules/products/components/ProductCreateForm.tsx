import { useMemo, useRef } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { FormWrapper } from '@/components/core/FormWrapper'
import { EMPTY_IMAGE_UPLOAD_VALUE } from '@/components/form/image-upload'
import { Button } from '@/components/ui/button'
import { ProductCreateSections } from '@/modules/products/components/ProductCreateSections'
import { createProductCreateSchema } from '@/modules/products/schemas/product-create.schema'
import type { ProductCreateFormValues, ProductCreatePayload } from '@/modules/products/types/product.types'
import { buildProductCreatePayload } from '@/modules/products/utils/product-create.utils'
import { Routes } from '@/routes/routes'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

type ProductCreateFormProps = {
  isSubmitting: boolean
  onSubmit: (payload: ProductCreatePayload) => Promise<unknown>
}

export const EMPTY_PRODUCT_CREATE_FORM_VALUES: ProductCreateFormValues = {
  categoryId: null,
  sku: '',
  name: { ar: '', en: '' },
  description: { ar: '', en: '' },
  basePrice: null,
  discountPercentage: null,
  discountEndAt: '',
  isPersonalizable: false,
  personalizationMaxLength: null,
  personalizationFee: null,
  hidePriceOnPackaging: false,
  isNewArrival: false,
  isActive: true,
  sortOrder: 0,
  images: EMPTY_IMAGE_UPLOAD_VALUE,
}

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
      }),
    [t]
  )

  const handleSubmit = async (values: ProductCreateFormValues, methods: UseFormReturn<ProductCreateFormValues>) => {
    if (submissionLockRef.current) return
    submissionLockRef.current = true
    try {
      await onSubmit(buildProductCreatePayload(values))
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, PRODUCT_CREATE_API_FIELD_ALIASES)
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
      <ProductCreateSections isSubmitting={isSubmitting} />
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
