import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form/FormInput'
import { ResponsiveDataFact } from '@/components/shared/data-display/ResponsiveDataLayout'
import { AffiliateStatusBadge } from '@/modules/affiliates/components/AffiliateStatusBadge'
import { createAffiliateProfileSchema } from '@/modules/affiliates/schemas/affiliate.schema'
import type { Affiliate, AffiliateProfileFormValues } from '@/modules/affiliates/types/affiliate.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

type Props = {
  affiliate: Affiliate
  formId: string
  isSubmitting: boolean
  onDirtyChange: (dirty: boolean) => void
  onSubmit: (values: AffiliateProfileFormValues, methods: UseFormReturn<AffiliateProfileFormValues>) => Promise<void>
}

export function AffiliateProfileForm({ affiliate, formId, isSubmitting, onDirtyChange, onSubmit }: Props) {
  const { t, i18n } = useTranslation()
  const locale = resolveAppLocale(i18n.language)
  const values = useMemo<AffiliateProfileFormValues>(
    () => ({
      name: affiliate.name,
      mobile: affiliate.mobile,
      email: affiliate.email,
      platform: affiliate.platform,
      username: affiliate.username,
    }),
    [affiliate]
  )
  const schema = useMemo(
    () =>
      createAffiliateProfileSchema({
        required: t('affiliates.validation.required'),
        emailInvalid: t('affiliates.validation.emailInvalid'),
        mobileInvalid: t('affiliates.validation.mobileInvalid'),
        codeInvalid: t('affiliates.validation.codeInvalid'),
        nameTooLong: t('affiliates.validation.nameTooLong'),
        emailTooLong: t('affiliates.validation.emailTooLong'),
        platformTooLong: t('affiliates.validation.platformTooLong'),
        usernameTooLong: t('affiliates.validation.usernameTooLong'),
      }),
    [t]
  )

  const handleSubmit = async (
    formValues: AffiliateProfileFormValues,
    methods: UseFormReturn<AffiliateProfileFormValues>
  ) => {
    const normalized = {
      name: formValues.name.trim().replace(/\s+/g, ' '),
      mobile: formValues.mobile.trim(),
      email: formValues.email.trim().toLowerCase(),
      platform: formValues.platform.trim().toLowerCase(),
      username: formValues.username.trim(),
    }
    try {
      await onSubmit(normalized, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError)
    }
  }

  return (
    <FormWrapper<AffiliateProfileFormValues>
      schema={schema}
      defaultValues={values}
      resetValues={values}
      resetValuesKey={affiliate.id}
      formId={formId}
      className="space-y-5"
      submissionDisabled={isSubmitting}
      onFormStateChange={({ isDirty }) => onDirtyChange(isDirty)}
      onSubmit={handleSubmit}
    >
      <FormInput
        name="name"
        label={t('affiliates.fields.name')}
        autoComplete="name"
        maxLength={150}
        required
        autoFocus
      />
      <FormInput
        name="mobile"
        label={t('affiliates.fields.mobile')}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        dir="ltr"
        required
      />
      <FormInput
        name="email"
        label={t('affiliates.fields.email')}
        type="email"
        inputMode="email"
        autoComplete="email"
        dir="ltr"
        className="normal-case"
        maxLength={254}
        required
      />
      <FormInput name="platform" label={t('affiliates.fields.platform')} maxLength={50} required />
      <FormInput name="username" label={t('affiliates.fields.username')} dir="ltr" maxLength={100} required />
      <section aria-labelledby="affiliate-edit-read-only" className="space-y-4 border-t border-border pt-5">
        <h2 id="affiliate-edit-read-only" className="font-semibold">
          {t('affiliates.detail.account')}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <ResponsiveDataFact label={t('affiliates.fields.code')}>
            <code dir="ltr" className="font-semibold">
              {affiliate.code}
            </code>
          </ResponsiveDataFact>
          <ResponsiveDataFact label={t('affiliates.fields.status')}>
            <AffiliateStatusBadge status={affiliate.status} />
          </ResponsiveDataFact>
          <ResponsiveDataFact label={t('affiliates.fields.createdAt')}>
            <time dateTime={affiliate.createdAt}>{formatDateTime(affiliate.createdAt, { locale }) || '—'}</time>
          </ResponsiveDataFact>
          <ResponsiveDataFact label={t('affiliates.fields.updatedAt')}>
            <time dateTime={affiliate.updatedAt}>{formatDateTime(affiliate.updatedAt, { locale }) || '—'}</time>
          </ResponsiveDataFact>
        </dl>
      </section>
    </FormWrapper>
  )
}
