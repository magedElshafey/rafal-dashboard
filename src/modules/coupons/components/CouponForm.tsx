import { useMemo, type BaseSyntheticEvent } from 'react'
import { useFormContext, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput, FormSelect, FormTextArea } from '@/components/form'
import { FormSwitch } from '@/components/form/FormSwitch'
import { createCouponSchema } from '@/modules/coupons/schemas/coupon.schema'
import type { CouponFormValues } from '@/modules/coupons/types/coupon.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export type CouponSubmitIntent = 'create' | 'create-another' | 'edit'

export const EMPTY_COUPON_FORM_VALUES: CouponFormValues = {
  code: '',
  name: { ar: '', en: '' },
  description: { ar: '', en: '' },
  type: 'percent',
  value: 0,
  maxDiscountAmount: null,
  minOrderAmount: null,
  startsAt: '',
  endsAt: '',
  isPublic: false,
  isActive: true,
  usageLimitTotal: null,
  usageLimitPerCustomer: null,
  newCustomersOnly: false,
}

type Props = {
  formId: string
  initialValues: CouponFormValues
  resetValuesKey: string | number
  isSubmitting: boolean
  onFormStateChange: (state: { isDirty: boolean; isValid: boolean }) => void
  onSubmit: (
    values: CouponFormValues,
    intent: CouponSubmitIntent,
    methods: UseFormReturn<CouponFormValues>
  ) => void | Promise<void>
}

function DiscountFields({ isSubmitting }: { isSubmitting: boolean }) {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<CouponFormValues>()
  const type = useWatch({ control, name: 'type' })
  const typeOptions = [
    { value: 'percent', label: t('coupons.types.percent') },
    { value: 'fixed', label: t('coupons.types.fixed') },
  ]

  return (
    <div className="grid items-start gap-5 sm:grid-cols-2">
      <FormSelect
        name="type"
        data={typeOptions}
        valueKey="value"
        labelKey="label"
        label={t('coupons.fields.type')}
        disabled={isSubmitting}
        required
        onChange={(nextType) => {
          if (nextType === 'fixed') {
            setValue('maxDiscountAmount', null, { shouldDirty: true, shouldValidate: true, shouldTouch: true })
          }
        }}
      />
      <FormInput
        name="value"
        label={t(type === 'percent' ? 'coupons.fields.percentValue' : 'coupons.fields.fixedValue')}
        type="number"
        inputMode="decimal"
        step="any"
        min={type === 'percent' ? 0 : undefined}
        max={type === 'percent' ? 100 : undefined}
        dir="ltr"
        disabled={isSubmitting}
        required
      />
      {type === 'percent' ? (
        <FormInput
          name="maxDiscountAmount"
          label={t('coupons.fields.maxDiscountAmount')}
          type="number"
          inputMode="decimal"
          step="any"
          dir="ltr"
          disabled={isSubmitting}
        />
      ) : null}
      <FormInput
        name="minOrderAmount"
        label={t('coupons.fields.minOrderAmount')}
        type="number"
        inputMode="decimal"
        step="any"
        dir="ltr"
        disabled={isSubmitting}
      />
    </div>
  )
}

export function CouponForm({
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
      createCouponSchema({
        required: t('coupons.validation.required'),
        validNumber: t('coupons.validation.validNumber'),
        percentRange: t('coupons.validation.percentRange'),
        validDate: t('coupons.validation.validDate'),
        dateOrder: t('coupons.validation.dateOrder'),
      }),
    [t]
  )

  const handleSubmit = async (
    values: CouponFormValues,
    methods: UseFormReturn<CouponFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLElement | null
    const intent = (submitter?.dataset.submitIntent ?? 'create') as CouponSubmitIntent
    try {
      await onSubmit(values, intent, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        code: 'code',
        'name.ar': 'name.ar',
        'name[ar]': 'name.ar',
        'name.en': 'name.en',
        'name[en]': 'name.en',
        'description.ar': 'description.ar',
        'description[ar]': 'description.ar',
        'description.en': 'description.en',
        'description[en]': 'description.en',
        type: 'type',
        value: 'value',
        max_discount_amount: 'maxDiscountAmount',
        min_order_amount: 'minOrderAmount',
        starts_at: 'startsAt',
        ends_at: 'endsAt',
        is_public: 'isPublic',
        is_active: 'isActive',
        usage_limit_total: 'usageLimitTotal',
        usage_limit_per_customer: 'usageLimitPerCustomer',
        new_customers_only: 'newCustomersOnly',
      })
    }
  }

  return (
    <FormWrapper<CouponFormValues>
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
        aria-labelledby="coupon-basic-title"
      >
        <h2 id="coupon-basic-title" className="font-semibold text-foreground">
          {t('coupons.sections.basic')}
        </h2>
        <FormInput name="code" label={t('coupons.fields.code')} dir="ltr" required autoFocus disabled={isSubmitting} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput name="name.ar" label={t('coupons.fields.nameAr')} dir="rtl" required disabled={isSubmitting} />
          <FormInput name="name.en" label={t('coupons.fields.nameEn')} dir="ltr" required disabled={isSubmitting} />
          <FormTextArea
            name="description.ar"
            label={t('coupons.fields.descriptionAr')}
            dir="rtl"
            disabled={isSubmitting}
          />
          <FormTextArea
            name="description.en"
            label={t('coupons.fields.descriptionEn')}
            dir="ltr"
            disabled={isSubmitting}
          />
        </div>
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="coupon-discount-title"
      >
        <h2 id="coupon-discount-title" className="font-semibold text-foreground">
          {t('coupons.sections.discount')}
        </h2>
        <DiscountFields isSubmitting={isSubmitting} />
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="coupon-schedule-title"
      >
        <h2 id="coupon-schedule-title" className="font-semibold text-foreground">
          {t('coupons.sections.schedule')}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            name="startsAt"
            label={t('coupons.fields.startsAt')}
            type="datetime-local"
            dir="ltr"
            disabled={isSubmitting}
          />
          <FormInput
            name="endsAt"
            label={t('coupons.fields.endsAt')}
            type="datetime-local"
            dir="ltr"
            disabled={isSubmitting}
          />
        </div>
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="coupon-limits-title"
      >
        <h2 id="coupon-limits-title" className="font-semibold text-foreground">
          {t('coupons.sections.limits')}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            name="usageLimitTotal"
            label={t('coupons.fields.usageLimitTotal')}
            type="number"
            inputMode="decimal"
            step="any"
            dir="ltr"
            disabled={isSubmitting}
          />
          <FormInput
            name="usageLimitPerCustomer"
            label={t('coupons.fields.usageLimitPerCustomer')}
            type="number"
            inputMode="decimal"
            step="any"
            dir="ltr"
            disabled={isSubmitting}
          />
        </div>
      </section>

      <section
        className="space-y-5 rounded-2xl border border-border bg-surface p-5"
        aria-labelledby="coupon-status-title"
      >
        <h2 id="coupon-status-title" className="font-semibold text-foreground">
          {t('coupons.sections.status')}
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          <FormSwitch name="isActive" label={t('coupons.fields.isActive')} disabled={isSubmitting} />
          <FormSwitch name="isPublic" label={t('coupons.fields.isPublic')} disabled={isSubmitting} />
          <FormSwitch name="newCustomersOnly" label={t('coupons.fields.newCustomersOnly')} disabled={isSubmitting} />
        </div>
      </section>
    </FormWrapper>
  )
}
