import { useMemo, type BaseSyntheticEvent } from 'react'
import { useFormContext, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormCheckbox, FormInput, FormSortOrder } from '@/components/form'
import { FormSwitch } from '@/components/form/FormSwitch'
import { createShippingMethodSchema } from '@/modules/shipping-methods/schemas/shipping-method.schema'
import type { ShippingMethodFormValues } from '@/modules/shipping-methods/types/shipping-method.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export type ShippingMethodSubmitIntent = 'create' | 'create-another' | 'edit'

export const EMPTY_SHIPPING_METHOD_FORM_VALUES: ShippingMethodFormValues = {
  code: '',
  name: { ar: '', en: '' },
  etaLabel: { ar: '', en: '' },
  price: 0,
  isPickup: false,
  isActive: true,
  sortOrder: null,
}

type Props = {
  mode: 'create' | 'edit'
  formId: string
  initialValues: ShippingMethodFormValues
  resetValuesKey: string | number
  isSubmitting: boolean
  onFormStateChange: (state: { isDirty: boolean; isValid: boolean }) => void
  onSubmit: (
    values: ShippingMethodFormValues,
    intent: ShippingMethodSubmitIntent,
    methods: UseFormReturn<ShippingMethodFormValues>
  ) => void | Promise<void>
}

function PricingFields({ isSubmitting }: { isSubmitting: boolean }) {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<ShippingMethodFormValues>()
  const isPickup = useWatch({ control, name: 'isPickup' })

  return (
    <div className="grid items-start gap-5 sm:grid-cols-2">
      <div className="pt-8">
        <FormSwitch
          name="isPickup"
          label={t('shippingMethods.fields.isPickup')}
          disabled={isSubmitting}
          onChange={(enabled) => {
            if (enabled) setValue('price', 0, { shouldDirty: true, shouldValidate: true, shouldTouch: true })
          }}
        />
        <p className="mt-2 text-sm text-muted-foreground">{t('shippingMethods.form.pickupHelper')}</p>
      </div>
      <FormInput
        name="price"
        label={t('shippingMethods.fields.price')}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        dir="ltr"
        disabled={isSubmitting || isPickup}
        required
      />
    </div>
  )
}

export function ShippingMethodForm({
  mode,
  formId,
  initialValues,
  resetValuesKey,
  isSubmitting,
  onFormStateChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation()
  const schema = useMemo(
    () =>
      createShippingMethodSchema(mode, {
        required: t('shippingMethods.validation.required'),
        validNumber: t('shippingMethods.validation.validNumber'),
        nonNegative: t('shippingMethods.validation.nonNegative'),
        integer: t('shippingMethods.validation.integer'),
        pickupPriceZero: t('shippingMethods.validation.pickupPriceZero'),
      }),
    [mode, t]
  )

  const handleSubmit = async (
    values: ShippingMethodFormValues,
    methods: UseFormReturn<ShippingMethodFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLElement | null
    const intent = (submitter?.dataset.submitIntent ?? 'create') as ShippingMethodSubmitIntent
    const normalized: ShippingMethodFormValues = {
      ...values,
      code: values.code.trim(),
      name: { ar: values.name.ar.trim(), en: values.name.en.trim() },
      etaLabel: { ar: values.etaLabel.ar.trim(), en: values.etaLabel.en.trim() },
    }
    try {
      await onSubmit(normalized, intent, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        code: 'code',
        'name.ar': 'name.ar',
        'name[ar]': 'name.ar',
        'name.en': 'name.en',
        'name[en]': 'name.en',
        'eta_label.ar': 'etaLabel.ar',
        'eta_label[ar]': 'etaLabel.ar',
        'eta_label.en': 'etaLabel.en',
        'eta_label[en]': 'etaLabel.en',
        price: 'price',
        is_pickup: 'isPickup',
        is_active: 'isActive',
        sort_order: 'sortOrder',
      })
    }
  }

  return (
    <FormWrapper<ShippingMethodFormValues>
      schema={schema}
      defaultValues={initialValues}
      resetValues={initialValues}
      resetValuesKey={resetValuesKey}
      formId={formId}
      className="space-y-6"
      submissionDisabled={isSubmitting}
      validationMode="onChange"
      onFormStateChange={onFormStateChange}
      onSubmit={handleSubmit}
    >
      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="shipping-method-basic-title"
      >
        <h2 id="shipping-method-basic-title" className="font-semibold text-foreground">
          {t('shippingMethods.sections.basic')}
        </h2>
        <FormInput
          name="code"
          label={t('shippingMethods.fields.code')}
          dir="ltr"
          required
          autoFocus
          disabled={isSubmitting}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            name="name.ar"
            label={t('shippingMethods.fields.nameAr')}
            dir="rtl"
            required
            disabled={isSubmitting}
          />
          <FormInput
            name="name.en"
            label={t('shippingMethods.fields.nameEn')}
            dir="ltr"
            required
            disabled={isSubmitting}
          />
        </div>
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="shipping-method-eta-title"
      >
        <h2 id="shipping-method-eta-title" className="font-semibold text-foreground">
          {t('shippingMethods.sections.eta')}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            name="etaLabel.ar"
            label={t('shippingMethods.fields.etaAr')}
            dir="rtl"
            required
            disabled={isSubmitting}
          />
          <FormInput
            name="etaLabel.en"
            label={t('shippingMethods.fields.etaEn')}
            dir="ltr"
            required
            disabled={isSubmitting}
          />
        </div>
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="shipping-method-pricing-title"
      >
        <h2 id="shipping-method-pricing-title" className="font-semibold text-foreground">
          {t('shippingMethods.sections.pricing')}
        </h2>
        <PricingFields isSubmitting={isSubmitting} />
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="shipping-method-status-title"
      >
        <h2 id="shipping-method-status-title" className="font-semibold text-foreground">
          {t('shippingMethods.sections.status')}
        </h2>
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <FormSortOrder
            name="sortOrder"
            label={t('shippingMethods.fields.sortOrder')}
            disabled={isSubmitting}
            required={mode === 'edit'}
          />
          <div className="pt-8">
            <FormCheckbox name="isActive" label={t('shippingMethods.fields.isActive')} disabled={isSubmitting} />
          </div>
        </div>
      </section>
    </FormWrapper>
  )
}
