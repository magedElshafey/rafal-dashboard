import { AlertTriangle, LoaderCircle, RotateCcw } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useFormContext, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form'
import { FormSwitch } from '@/components/form/FormSwitch'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { DashboardPageHeader } from '@/components/shared/dashboard/atoms/DashboardPageHeader'
import { Button } from '@/components/ui/button'
import { isAffiliateSettingsVersionConflict } from '@/modules/affiliates/hooks/useUpdateAffiliateSettings'
import { createAffiliateSettingsSchema } from '@/modules/affiliates/schemas/affiliate-settings.schema'
import type {
  AffiliateSettings,
  AffiliateSettingsFormValues,
  UpdateAffiliateSettingsPayload,
} from '@/modules/affiliates/types/affiliate.types'
import {
  buildAffiliateSettingsPayload,
  toAffiliateSettingsFormValues,
} from '@/modules/affiliates/utils/affiliate-settings'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

type Props = {
  settings: AffiliateSettings
  isSubmitting: boolean
  onSubmit: (payload: UpdateAffiliateSettingsPayload) => Promise<AffiliateSettings>
  onReloadConflict: () => Promise<{ data?: AffiliateSettings; isSuccess: boolean }>
}

type ConflictState = {
  latest?: AffiliateSettings
  methods: UseFormReturn<AffiliateSettingsFormValues>
  proposedFields: (keyof AffiliateSettingsFormValues)[]
  reloadFailed: boolean
}

function PristineBaselineSync({
  settings,
  blocked,
  acceptedBaselineRef,
}: {
  settings: AffiliateSettings
  blocked: boolean
  acceptedBaselineRef: MutableRefObject<AffiliateSettings>
}) {
  const {
    reset,
    formState: { isDirty },
  } = useFormContext<AffiliateSettingsFormValues>()
  useEffect(() => {
    if (!blocked && !isDirty && settings.version >= acceptedBaselineRef.current.version) {
      acceptedBaselineRef.current = settings
      reset(toAffiliateSettingsFormValues(settings))
    }
  }, [acceptedBaselineRef, blocked, isDirty, reset, settings])
  return null
}

function FormMethodsBridge({
  methodsRef,
}: {
  methodsRef: MutableRefObject<UseFormReturn<AffiliateSettingsFormValues> | null>
}) {
  const methods = useFormContext<AffiliateSettingsFormValues>()
  useEffect(() => {
    methodsRef.current = methods
    return () => {
      methodsRef.current = null
    }
  }, [methods, methodsRef])
  return null
}

function SwitchField({
  name,
  label,
  description,
  disabled,
}: {
  name: string
  label: string
  description: string
  disabled: boolean
}) {
  const descriptionId = useId()
  return (
    <div className="space-y-1.5">
      <FormSwitch name={name} label={label} aria-label={label} aria-describedby={descriptionId} disabled={disabled} />
      <p id={descriptionId} className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function ServerValues({ settings }: { settings: AffiliateSettings }) {
  const { t } = useTranslation()
  const values = [
    [
      t('affiliates.settings.fields.programEnabled'),
      t(settings.programEnabled ? 'affiliates.settings.values.enabled' : 'affiliates.settings.values.disabled'),
    ],
    [
      t('affiliates.settings.fields.applicationsEnabled'),
      t(settings.applicationsEnabled ? 'affiliates.settings.values.enabled' : 'affiliates.settings.values.disabled'),
    ],
    [t('affiliates.settings.fields.customerDiscountPercentage'), `${settings.customerDiscountPercentage}%`],
    [t('affiliates.settings.fields.affiliateCommissionPercentage'), `${settings.affiliateCommissionPercentage}%`],
    [t('affiliates.settings.fields.minimumPayoutAmount'), settings.minimumPayoutAmount],
    [t('affiliates.settings.fields.termsPageReference'), settings.termsPageReference],
  ]
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {values.map(([label, value]) => (
        <div key={label} className="min-w-0 rounded-lg bg-background p-3">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-1 [overflow-wrap:anywhere]" dir="auto">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function AffiliateSettingsForm({ settings, isSubmitting, onSubmit, onReloadConflict }: Props) {
  const { t, i18n } = useTranslation()
  const [formState, setFormState] = useState({ isDirty: false, isValid: false })
  const [conflict, setConflict] = useState<ConflictState | null>(null)
  const lockRef = useRef(false)
  const acceptedBaselineRef = useRef(settings)
  const methodsRef = useRef<UseFormReturn<AffiliateSettingsFormValues> | null>(null)
  const values = useMemo(() => toAffiliateSettingsFormValues(settings), [settings])
  const schema = useMemo(
    () =>
      createAffiliateSettingsSchema({
        required: t('affiliates.settings.validation.required'),
        validNumber: t('affiliates.settings.validation.validNumber'),
        percentageRange: t('affiliates.settings.validation.percentageRange'),
        payoutFormat: t('affiliates.settings.validation.payoutFormat'),
        payoutPositive: t('affiliates.settings.validation.payoutPositive'),
        termsSlug: t('affiliates.settings.validation.termsSlug'),
      }),
    [t]
  )

  const submitValues = async (
    submittedValues: AffiliateSettingsFormValues,
    methods: UseFormReturn<AffiliateSettingsFormValues>,
    baseline: AffiliateSettings
  ) => {
    if (lockRef.current) return
    const payload = buildAffiliateSettingsPayload(baseline, submittedValues)
    if (!payload) {
      acceptedBaselineRef.current = baseline
      methods.reset(toAffiliateSettingsFormValues(baseline))
      setConflict(null)
      return
    }
    lockRef.current = true
    try {
      const updated = await onSubmit(payload)
      acceptedBaselineRef.current = updated
      methods.reset(toAffiliateSettingsFormValues(updated))
      setConflict(null)
    } catch (error) {
      if (isAffiliateSettingsVersionConflict(error)) {
        const reloaded = await onReloadConflict()
        const latest = reloaded.isSuccess ? reloaded.data : undefined
        const proposedFields = Object.keys(payload).filter(
          (key): key is keyof AffiliateSettingsFormValues => key !== 'version'
        )
        setConflict({ latest, methods, proposedFields, reloadFailed: !latest })
      } else {
        applyApiValidationErrors(error, methods.setError, {
          program_enabled: 'programEnabled',
          applications_enabled: 'applicationsEnabled',
          customer_discount_percentage: 'customerDiscountPercentage',
          affiliate_commission_percentage: 'affiliateCommissionPercentage',
          minimum_payout_amount: 'minimumPayoutAmount',
          terms_page_reference: 'termsPageReference',
        })
      }
    } finally {
      lockRef.current = false
    }
  }

  const handleSubmit = (
    submittedValues: AffiliateSettingsFormValues,
    methods: UseFormReturn<AffiliateSettingsFormValues>
  ) => submitValues(submittedValues, methods, conflict?.latest ?? acceptedBaselineRef.current)

  const retryConflict = async () => {
    if (!conflict?.latest || isSubmitting || lockRef.current) return
    const valid = await conflict.methods.trigger()
    if (valid) {
      const draft = conflict.methods.getValues()
      const proposedValues = toAffiliateSettingsFormValues(conflict.latest)
      conflict.proposedFields.forEach((key) => Object.assign(proposedValues, { [key]: draft[key] }))
      await submitValues(proposedValues, conflict.methods, conflict.latest)
    }
  }

  const reloadConflict = async () => {
    if (!conflict) return
    const reloaded = await onReloadConflict()
    const latest = reloaded.isSuccess ? reloaded.data : undefined
    setConflict({ ...conflict, latest, reloadFailed: !latest })
  }

  const discard = () => {
    const baseline = conflict?.latest ?? settings
    const methods = conflict?.methods ?? methodsRef.current
    acceptedBaselineRef.current = baseline
    methods?.reset(toAffiliateSettingsFormValues(baseline))
    setConflict(null)
  }

  const locale = resolveAppLocale(i18n.language)
  const updatedAt = formatDateTime((conflict?.latest ?? settings).updatedAt, { locale }) || '—'
  const fieldsDisabled = isSubmitting || Boolean(conflict)

  return (
    <FormWrapper<AffiliateSettingsFormValues>
      schema={schema}
      defaultValues={values}
      validationMode="onChange"
      submissionDisabled={isSubmitting}
      onFormStateChange={setFormState}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <PristineBaselineSync settings={settings} blocked={Boolean(conflict)} acceptedBaselineRef={acceptedBaselineRef} />
      <FormMethodsBridge methodsRef={methodsRef} />
      <DashboardPageHeader
        title={t('affiliates.settings.title')}
        description={t('affiliates.settings.description')}
        intro={t('affiliates.settings.updatedAt', { date: updatedAt })}
        actions={
          <>
            <Button type="button" variant="outline" disabled={!formState.isDirty || isSubmitting} onClick={discard}>
              <RotateCcw aria-hidden />
              {t('affiliates.settings.actions.discard')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formState.isDirty || !formState.isValid || Boolean(conflict)}
            >
              {isSubmitting ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
              {t(isSubmitting ? 'affiliates.settings.actions.saving' : 'affiliates.settings.actions.save')}
            </Button>
          </>
        }
      />

      <div role="note" className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        {t('affiliates.settings.mockNotice')}
      </div>

      {conflict ? (
        <div role="alert" className="space-y-4 rounded-xl border border-warning bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <h2 className="font-semibold">{t('affiliates.settings.conflict.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('affiliates.settings.conflict.message')}</p>
            </div>
          </div>
          {conflict.latest ? <ServerValues settings={conflict.latest} /> : null}
          {conflict.reloadFailed ? <p className="text-sm">{t('affiliates.settings.conflict.reloadError')}</p> : null}
          <div className="flex flex-wrap gap-2">
            {conflict.latest ? (
              <Button type="button" onClick={() => void retryConflict()} disabled={isSubmitting}>
                {t('affiliates.settings.conflict.retry')}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => void reloadConflict()}>
                {t('affiliates.settings.conflict.reload')}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={discard}>
              {t('affiliates.settings.actions.discard')}
            </Button>
          </div>
        </div>
      ) : null}

      <DashboardCard padding="lg" className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('affiliates.settings.sections.availability.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('affiliates.settings.sections.availability.description')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SwitchField
            name="programEnabled"
            label={t('affiliates.settings.fields.programEnabled')}
            description={t('affiliates.settings.help.programEnabled')}
            disabled={fieldsDisabled}
          />
          <SwitchField
            name="applicationsEnabled"
            label={t('affiliates.settings.fields.applicationsEnabled')}
            description={t('affiliates.settings.help.applicationsEnabled')}
            disabled={fieldsDisabled}
          />
        </div>
      </DashboardCard>

      <DashboardCard padding="lg" className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('affiliates.settings.sections.commercial.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('affiliates.settings.sections.commercial.description')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormInput
            name="customerDiscountPercentage"
            label={t('affiliates.settings.fields.customerDiscountPercentage')}
            description={t('affiliates.settings.help.customerDiscountPercentage')}
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="any"
            dir="ltr"
            disabled={fieldsDisabled}
            required
          />
          <FormInput
            name="affiliateCommissionPercentage"
            label={t('affiliates.settings.fields.affiliateCommissionPercentage')}
            description={t('affiliates.settings.help.affiliateCommissionPercentage')}
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="any"
            dir="ltr"
            disabled={fieldsDisabled}
            required
          />
          <FormInput
            name="minimumPayoutAmount"
            label={t('affiliates.settings.fields.minimumPayoutAmount')}
            description={t('affiliates.settings.help.minimumPayoutAmount')}
            inputMode="decimal"
            dir="ltr"
            disabled={fieldsDisabled}
            required
          />
        </div>
      </DashboardCard>

      <DashboardCard padding="lg" className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('affiliates.settings.sections.legal.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('affiliates.settings.sections.legal.description')}</p>
        </div>
        <FormInput
          name="termsPageReference"
          label={t('affiliates.settings.fields.termsPageReference')}
          description={t('affiliates.settings.help.termsPageReference')}
          placeholder="affiliate-terms"
          autoComplete="off"
          dir="ltr"
          maxLength={200}
          disabled={fieldsDisabled}
          required
        />
      </DashboardCard>
    </FormWrapper>
  )
}
