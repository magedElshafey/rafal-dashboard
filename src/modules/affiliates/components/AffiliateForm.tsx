import { useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { affiliatesService } from '../api/affiliates.service'
import { affiliatesKeys } from '../queries/affiliates.keys'
import { getQueryClientAuthBoundaryEpoch } from '@/lib/react-query/query-client'
import { Button } from '@/components/ui/button'
import type { UseFormReturn } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form/FormInput'
import { createAffiliateSchema } from '@/modules/affiliates/schemas/affiliate.schema'
import type { AffiliateFormValues } from '@/modules/affiliates/types/affiliate.types'
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
  isSubmitting: boolean
  onSubmit: (values: AffiliateFormValues, methods: UseFormReturn<AffiliateFormValues>) => Promise<void>
}

function AffiliateCodeField() {
  const { t } = useTranslation()
  const { setValue, getValues, watch, formState } = useFormContext<AffiliateFormValues>()
  const name = watch('name')
  const revision = useRef(0)
  const request = useRef(0)
  const activeSignal = useRef<AbortSignal | null>(null)
  useEffect(() => {
    const subscription = watch((_values, change) => {
      if (change.name === 'name' || change.name === 'code') revision.current += 1
    })
    return () => {
      request.current += 1
      subscription.unsubscribe()
    }
  }, [watch])
  const suggestion = useQuery({
    queryKey: [...affiliatesKeys.all, 'code-suggestion', name],
    queryFn: ({ signal }) => {
      activeSignal.current = signal
      return affiliatesService.generateCode(name, signal)
    },
    enabled: false,
    retry: false,
    gcTime: 0,
  })
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
        onChange={(value) => setValue('code', value.toUpperCase(), { shouldDirty: true, shouldValidate: true })}
      />
      <Button
        type="button"
        variant="outline"
        disabled={suggestion.isFetching || formState.isSubmitting}
        onClick={async () => {
          const before = getValues('code')
          const editRevision = revision.current
          const requestId = ++request.current
          const epoch = getQueryClientAuthBoundaryEpoch()
          const pending = suggestion.refetch()
          const signal = activeSignal.current
          const result = await pending
          if (
            !signal?.aborted &&
            requestId === request.current &&
            editRevision === revision.current &&
            result.data &&
            !result.error &&
            epoch === getQueryClientAuthBoundaryEpoch() &&
            getValues('code') === before &&
            getValues('name') === name
          )
            setValue('code', result.data.code.toUpperCase(), { shouldDirty: true, shouldValidate: true })
        }}
      >
        {t(suggestion.isFetching ? 'affiliates.form.suggestionLoading' : 'affiliates.actions.generateCode')}
      </Button>
      {suggestion.isError ? <p role="alert">{t('affiliates.form.suggestionError')}</p> : null}
    </div>
  )
}

export function AffiliateForm({ formId, isSubmitting, onSubmit }: Props) {
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
      applyApiValidationErrors(
        error,
        methods.setError,
        {
          name: 'name',
          phone: 'mobile',
          email: 'email',
          platform: 'platform',
          account_handle: 'username',
          code: 'code',
        },
        ['name', 'phone', 'email', 'platform', 'account_handle', 'code']
      )
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
        <AffiliateCodeField />
      </section>
    </FormWrapper>
  )
}
