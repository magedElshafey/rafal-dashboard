import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useFormContext, useFormState, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormCheckbox, FormImageUploader, FormInput } from '@/components/form'
import { EMPTY_IMAGE_UPLOAD_VALUE } from '@/components/form/image-upload'
import { Button } from '@/components/ui/button'
import { createProductVariantSchema } from '@/modules/products/schemas/product-variant.schema'
import { PRODUCT_IMAGE_MAX_SIZE } from '@/modules/products/schemas/product-create.schema'
import type { ProductVariantFormValues } from '@/modules/products/types/product-variant.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export const EMPTY_PRODUCT_VARIANT_FORM: ProductVariantFormValues = {
  sku: '',
  attributes: [{ key: '', value: '' }],
  priceOverride: null,
  isActive: true,
  images: EMPTY_IMAGE_UPLOAD_VALUE,
}

type Props = {
  formId: string
  isSubmitting: boolean
  onSubmit: (values: ProductVariantFormValues, methods: UseFormReturn<ProductVariantFormValues>) => Promise<void>
}

function VariantAttributesEditor({ disabled }: { disabled: boolean }) {
  const { t } = useTranslation()
  const { control } = useFormContext<ProductVariantFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' })
  const { errors } = useFormState({ control, name: 'attributes' })
  const rootError = (errors.attributes as { message?: string } | undefined)?.message

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">{t('products.variants.fields.attributes')}</legend>
      {fields.map((field, index) => (
        <div key={field.id} className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <FormInput
            name={`attributes.${index}.key`}
            label={t('products.variants.fields.attributeKey')}
            disabled={disabled}
          />
          <FormInput
            name={`attributes.${index}.value`}
            label={t('products.variants.fields.attributeValue')}
            disabled={disabled}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="mt-7 text-destructive"
            disabled={disabled}
            aria-label={t('products.variants.actions.removeAttribute', { index: index + 1 })}
            onClick={() => remove(index)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ))}
      {rootError ? (
        <p role="alert" className="text-sm text-destructive">
          {rootError}
        </p>
      ) : null}
      <Button type="button" variant="outline" disabled={disabled} onClick={() => append({ key: '', value: '' })}>
        <Plus aria-hidden="true" />
        {t('products.variants.actions.addAttribute')}
      </Button>
    </fieldset>
  )
}

export function ProductVariantForm({ formId, isSubmitting, onSubmit }: Props) {
  const { t } = useTranslation()
  const schema = useMemo(
    () =>
      createProductVariantSchema({
        required: t('products.validation.required'),
        maxLength: t('products.validation.maxLength'),
        validNumber: t('products.validation.validNumber'),
        nonNegative: t('products.validation.nonNegative'),
        attributeIncomplete: t('products.variants.validation.attributeIncomplete'),
        attributeDuplicate: t('products.variants.validation.attributeDuplicate'),
        imageType: t('products.validation.imageType'),
        imageSize: t('products.validation.imageSize'),
      }),
    [t]
  )

  const handleSubmit = async (values: ProductVariantFormValues, methods: UseFormReturn<ProductVariantFormValues>) => {
    try {
      await onSubmit(values, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        sku: 'sku',
        attributes: 'attributes',
        price_override: 'priceOverride',
        is_active: 'isActive',
        'images.*': 'images',
      })
    }
  }

  return (
    <FormWrapper<ProductVariantFormValues>
      schema={schema}
      defaultValues={EMPTY_PRODUCT_VARIANT_FORM}
      formId={formId}
      submissionDisabled={isSubmitting}
      className="space-y-6"
      onSubmit={handleSubmit}
    >
      <FormInput
        name="sku"
        label={t('products.variants.fields.sku')}
        dir="ltr"
        maxLength={255}
        disabled={isSubmitting}
        required
        autoFocus
      />
      <VariantAttributesEditor disabled={isSubmitting} />
      <FormInput
        name="priceOverride"
        label={t('products.variants.fields.priceOverride')}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        dir="ltr"
        disabled={isSubmitting}
        placeholder={t('products.variants.usesBasePrice')}
      />
      <p className="-mt-4 text-xs text-muted-foreground">{t('products.variants.priceHelp')}</p>
      <FormCheckbox name="isActive" label={t('products.variants.fields.active')} disabled={isSubmitting} />
      <FormImageUploader<ProductVariantFormValues>
        name="images"
        label={t('products.variants.fields.images')}
        mode="multiple"
        accept="image/*"
        maxFileSize={PRODUCT_IMAGE_MAX_SIZE}
        previewFit="contain"
        disabled={isSubmitting}
      />
    </FormWrapper>
  )
}
