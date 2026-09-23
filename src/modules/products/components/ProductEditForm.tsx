import { useEffect, useMemo, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import type { FieldNamesMarkedBoolean, UseFormReturn } from 'react-hook-form'
import { useFormContext, useFormState } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { FormWrapper } from '@/components/core/FormWrapper'
import { Button } from '@/components/ui/button'
import { ProductFormSections } from '@/modules/products/components/ProductFormSections'
import { createProductCreateSchema } from '@/modules/products/schemas/product-create.schema'
import type { ProductDetail, ProductFormValues, ProductUpdatePayload } from '@/modules/products/types/product.types'
import { buildProductUpdatePayload, productDetailToFormValues } from '@/modules/products/utils/product-edit.utils'
import { PRODUCT_CREATE_API_FIELD_ALIASES } from '@/modules/products/components/ProductCreateForm'
import { Routes } from '@/routes/routes'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

type Props = {
  product: ProductDetail
  isSubmitting: boolean
  onSubmit: (payload: ProductUpdatePayload) => Promise<ProductDetail>
  onDeleteImage: (imageId: number) => Promise<unknown>
  deletingImageId: number | null
}

function ProductDirtyFieldsTracker({
  onChange,
}: {
  onChange: (dirtyFields: Readonly<FieldNamesMarkedBoolean<ProductFormValues>>) => void
}) {
  const { control } = useFormContext<ProductFormValues>()
  const { dirtyFields } = useFormState({ control })
  useEffect(() => {
    onChange(dirtyFields)
  }, [dirtyFields, onChange])
  return null
}

export function ProductEditForm({ product, isSubmitting, onSubmit, onDeleteImage, deletingImageId }: Props) {
  const { t } = useTranslation()
  const lock = useRef(false)
  const dirtyFieldsRef = useRef<Readonly<FieldNamesMarkedBoolean<ProductFormValues>>>({})
  const [state, setState] = useState({ isDirty: false, isValid: true })
  const initialValues = useRef(productDetailToFormValues(product)).current
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

  const handleSubmit = async (values: ProductFormValues, methods: UseFormReturn<ProductFormValues>) => {
    if (lock.current) return
    lock.current = true
    try {
      const updated = await onSubmit(buildProductUpdatePayload(values, dirtyFieldsRef.current))
      methods.reset(productDetailToFormValues(updated))
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, PRODUCT_CREATE_API_FIELD_ALIASES)
    } finally {
      lock.current = false
    }
  }

  return (
    <FormWrapper<ProductFormValues>
      schema={schema}
      defaultValues={initialValues}
      validationMode="onChange"
      submissionDisabled={isSubmitting}
      onFormStateChange={setState}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <ProductDirtyFieldsTracker onChange={(dirtyFields) => (dirtyFieldsRef.current = dirtyFields)} />
      <ProductFormSections
        isSubmitting={isSubmitting}
        existingImages={product.images}
        onDeleteExistingImage={onDeleteImage}
        deletingExistingImageId={deletingImageId}
      />
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button asChild variant="outline" size="lg">
          <Link to={Routes.products}>{t('products.actions.cancel')}</Link>
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting || !state.isDirty || !state.isValid}>
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {isSubmitting ? t('products.actions.saving') : t('products.actions.save')}
        </Button>
      </div>
    </FormWrapper>
  )
}
