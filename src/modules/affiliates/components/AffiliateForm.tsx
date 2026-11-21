import { useEffect, useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form/FormInput'
import { Button } from '@/components/ui/button'
import { createAffiliateSchema } from '@/modules/affiliates/schemas/affiliate.schema'
import type { AffiliateCodeSuggestion, AffiliateFormValues } from '@/modules/affiliates/types/affiliate.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export const EMPTY_AFFILIATE_FORM_VALUES: AffiliateFormValues = {
  name: '',
  mobile: '',
  email: '',
  platform: '',
  username: '',
  code: '',
}

type Props = {
  formId: string
  suggestion?: AffiliateCodeSuggestion
  suggestionError: boolean
  suggestionLoading: boolean
  isSubmitting: boolean
  onRetrySuggestion: () => void
  onSubmit: (values: AffiliateFormValues, methods: UseFormReturn<AffiliateFormValues>) => Promise<void>
}

function AffiliateCodeField({
  suggestion,
  suggestionError,
  suggestionLoading,
  onRetrySuggestion,
}: Pick<Props, 'suggestion' | 'suggestionError' | 'suggestionLoading' | 'onRetrySuggestion'>) {
  const { t } = useTranslation()
  const { getFieldState, setValue } = useFormContext<AffiliateFormValues>()

  useEffect(() => {
    if (suggestion?.code && !getFieldState('code').isDirty) {
      setValue('code', suggestion.code, { shouldDirty: false, shouldTouch: false, shouldValidate: true })
    }
  }, [getFieldState, setValue, suggestion])

  return (
    <div className="space-y-2">
      <FormInput
        name="code"
        label={t('affiliates.fields.code')}
        description={t('affiliates.form.codeDescription')}
        placeholder={t('affiliates.form.codePlaceholder')}
        autoComplete="off"
        dir="ltr"
        maxLength={20}
        required
        onChange={(value) => setValue('code', value.toUpperCase(), { shouldDirty: true, shouldValidate: true })}
      />
      {suggestionLoading ? (
        <p role="status" className="text-xs text-muted-foreground">
          {t('affiliates.form.suggestionLoading')}
        </p>
      ) : null}
      {suggestionError ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-xs text-destructive">
          <span>{t('affiliates.form.suggestionError')}</span>
          <Button type="button" variant="outline" size="sm" onClick={onRetrySuggestion}>
            {t('affiliates.actions.retrySuggestion')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function AffiliateForm({
  formId,
  suggestion,
  suggestionError,
  suggestionLoading,
  isSubmitting,
  onRetrySuggestion,
  onSubmit,
}: Props) {
  const { t } = useTranslation()
  const schema = useMemo(
    () =>
      createAffiliateSchema({
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

  const handleSubmit = async (values: AffiliateFormValues, methods: UseFormReturn<AffiliateFormValues>) => {
    const normalized: AffiliateFormValues = {
      name: values.name.trim().replace(/\s+/g, ' '),
      mobile: values.mobile.trim(),
      email: values.email.trim().toLowerCase(),
      platform: values.platform.trim().toLowerCase(),
      username: values.username.trim(),
      code: values.code.trim().toUpperCase(),
    }
    try {
      await onSubmit(normalized, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError)
    }
  }

  return (
    <FormWrapper<AffiliateFormValues>
      schema={schema}
      defaultValues={EMPTY_AFFILIATE_FORM_VALUES}
      formId={formId}
      className="space-y-7"
      submissionDisabled={isSubmitting}
      onSubmit={handleSubmit}
    >
      <section className="space-y-5" aria-labelledby="affiliate-personal-information">
        <h2 id="affiliate-personal-information" className="font-semibold text-foreground">
          {t('affiliates.form.personalInformation')}
        </h2>
        <FormInput
          name="name"
          label={t('affiliates.fields.name')}
          placeholder={t('affiliates.form.namePlaceholder')}
          autoComplete="name"
          maxLength={150}
          required
          autoFocus
        />
        <FormInput
          name="mobile"
          label={t('affiliates.fields.mobile')}
          placeholder={t('affiliates.form.mobilePlaceholder')}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          required
        />
        <FormInput
          name="email"
          label={t('affiliates.fields.email')}
          placeholder={t('affiliates.form.emailPlaceholder')}
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          className="normal-case"
          maxLength={254}
          required
        />
      </section>

      <section className="space-y-5" aria-labelledby="affiliate-social-information">
        <h2 id="affiliate-social-information" className="font-semibold text-foreground">
          {t('affiliates.form.socialInformation')}
        </h2>
        <FormInput
          name="platform"
          label={t('affiliates.fields.platform')}
          placeholder={t('affiliates.form.platformPlaceholder')}
          autoComplete="off"
          maxLength={50}
          required
        />
        <FormInput
          name="username"
          label={t('affiliates.fields.username')}
          placeholder={t('affiliates.form.usernamePlaceholder')}
          autoComplete="off"
          dir="ltr"
          maxLength={100}
          required
        />
      </section>

      <section className="space-y-5" aria-labelledby="affiliate-code-information">
        <h2 id="affiliate-code-information" className="font-semibold text-foreground">
          {t('affiliates.form.affiliateCode')}
        </h2>
        <AffiliateCodeField
          suggestion={suggestion}
          suggestionError={suggestionError}
          suggestionLoading={suggestionLoading}
          onRetrySuggestion={onRetrySuggestion}
        />
      </section>
    </FormWrapper>
  )
}
