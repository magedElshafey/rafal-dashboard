import { isAxiosError } from 'axios'
import { AlertTriangle, LoaderCircle, RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFormContext, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form'
import { FormSwitch } from '@/components/form/FormSwitch'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { createLoyaltySettingsSchema } from '@/modules/loyalty/schemas/loyalty-settings.schema'
import type {
  LoyaltySettings,
  LoyaltySettingsFormValues,
  LoyaltySettingsUpdatePayload,
} from '@/modules/loyalty/types/loyalty.types'
import {
  buildLoyaltySettingsPayload,
  calculateLoyaltyPreview,
  LOYALTY_PREVIEW_ORDER_AMOUNT,
  toLoyaltySettingsFormValues,
} from '@/modules/loyalty/utils/loyalty-settings'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'
import { formatDateTime, resolveAppLocale } from '@/utils/date/date.helpers'

type Props = {
  settings: LoyaltySettings
  isSubmitting: boolean
  onSubmit: (payload: LoyaltySettingsUpdatePayload) => Promise<LoyaltySettings>
  onReloadConflict: () => void | Promise<unknown>
}

type PendingDisable = {
  values: LoyaltySettingsFormValues
  methods: UseFormReturn<LoyaltySettingsFormValues>
}

function LoyaltyPreviewCard() {
  const { t, i18n } = useTranslation()
  const { control } = useFormContext<LoyaltySettingsFormValues>()
  const [amountPerPoint, redeemPoints, redeemAmount] = useWatch({
    control,
    name: ['amountPerPoint', 'redeemPoints', 'redeemAmount'],
  })
  const preview = calculateLoyaltyPreview({ amountPerPoint, redeemPoints, redeemAmount })
  const locale = resolveAppLocale(i18n.language)
  const number = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }), [locale])

  return (
    <DashboardCard padding="lg" className="space-y-2" aria-live="polite">
      <h2 className="text-lg font-semibold">{t('loyalty.preview.title')}</h2>
      {preview ? (
        <p className="text-sm text-foreground">
          {t('loyalty.preview.example', {
            order: number.format(LOYALTY_PREVIEW_ORDER_AMOUNT),
            points: number.format(preview.points),
            value: number.format(preview.value),
            percent: number.format(preview.returnPercent),
          })}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t('loyalty.preview.unavailable')}</p>
      )}
      <p className="text-xs text-muted-foreground">{t('loyalty.preview.nominalHint')}</p>
      {preview && preview.returnPercent > 10 ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-warning bg-warning/10 p-4 text-sm"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
          <p>{t('loyalty.preview.highReturnWarning')}</p>
        </div>
      ) : null}
    </DashboardCard>
  )
}

function SettingsFields({ isSubmitting }: { isSubmitting: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      <DashboardCard padding="lg" className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('loyalty.sections.status.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('loyalty.sections.status.description')}</p>
        </div>
        <FormSwitch
          name="isEnabled"
          label={t('loyalty.fields.isEnabled')}
          disabled={isSubmitting}
          aria-label={t('loyalty.fields.isEnabled')}
        />
      </DashboardCard>

      <DashboardCard padding="lg" className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('loyalty.sections.earning.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('loyalty.sections.earning.description')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            name="amountPerPoint"
            label={t('loyalty.fields.amountPerPoint')}
            type="number"
            inputMode="decimal"
            min={0.01}
            max={1000}
            step={0.01}
            disabled={isSubmitting}
            required
          />
        </div>
      </DashboardCard>

      <DashboardCard padding="lg" className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('loyalty.sections.redemption.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('loyalty.sections.redemption.description')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            name="redeemPoints"
            label={t('loyalty.fields.redeemPoints')}
            type="number"
            inputMode="numeric"
            min={1}
            max={100000}
            step={1}
            disabled={isSubmitting}
            required
          />
          <FormInput
            name="redeemAmount"
            label={t('loyalty.fields.redeemAmount')}
            type="number"
            inputMode="decimal"
            min={0.01}
            max={10000}
            step={0.01}
            disabled={isSubmitting}
            required
          />
          <FormInput
            name="maxRedeemPercent"
            label={t('loyalty.fields.maxRedeemPercent')}
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            step={1}
            disabled={isSubmitting}
            required
          />
          <FormInput
            name="minRedeemPoints"
            label={t('loyalty.fields.minRedeemPoints')}
            type="number"
            inputMode="numeric"
            min={0}
            max={100000}
            step={1}
            disabled={isSubmitting}
            required
          />
        </div>
      </DashboardCard>

      <DashboardCard padding="lg" className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t('loyalty.sections.expiry.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('loyalty.sections.expiry.description')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormInput
            name="validityMonths"
            label={t('loyalty.fields.validityMonths')}
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            step={1}
            disabled={isSubmitting}
            required
          />
          <FormInput
            name="expiryWarningDays"
            label={t('loyalty.fields.expiryWarningDays')}
            type="number"
            inputMode="numeric"
            min={1}
            max={90}
            step={1}
            disabled={isSubmitting}
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">{t('loyalty.sections.expiry.contractHint')}</p>
      </DashboardCard>
    </div>
  )
}

export function LoyaltySettingsForm({ settings, isSubmitting, onSubmit, onReloadConflict }: Props) {
  const { t, i18n } = useTranslation()
  const [formState, setFormState] = useState({ isDirty: false, isValid: false })
  const [pendingDisable, setPendingDisable] = useState<PendingDisable | null>(null)
  const [hasConflict, setHasConflict] = useState(false)
  const submissionLockRef = useRef(false)
  const values = useMemo(() => toLoyaltySettingsFormValues(settings), [settings])

  useEffect(() => {
    setHasConflict(false)
  }, [settings.versionId])

  const schema = useMemo(
    () =>
      createLoyaltySettingsSchema({
        required: t('loyalty.validation.required'),
        validNumber: t('loyalty.validation.validNumber'),
        integer: t('loyalty.validation.integer'),
        amountPerPointRange: t('loyalty.validation.amountPerPointRange'),
        redeemPointsRange: t('loyalty.validation.redeemPointsRange'),
        redeemAmountRange: t('loyalty.validation.redeemAmountRange'),
        percentRange: t('loyalty.validation.percentRange'),
        minimumPointsRange: t('loyalty.validation.minimumPointsRange'),
        validityRange: t('loyalty.validation.validityRange'),
        warningRange: t('loyalty.validation.warningRange'),
        warningBeforeValidity: t('loyalty.validation.warningBeforeValidity'),
        twoDecimals: t('loyalty.validation.twoDecimals'),
      }),
    [t]
  )

  const submitValues = async (
    submittedValues: LoyaltySettingsFormValues,
    methods: UseFormReturn<LoyaltySettingsFormValues>,
    confirmDisable = false
  ) => {
    if (submissionLockRef.current) return
    submissionLockRef.current = true
    setHasConflict(false)
    try {
      const updated = await onSubmit(buildLoyaltySettingsPayload(settings, submittedValues, confirmDisable))
      methods.reset(toLoyaltySettingsFormValues(updated))
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setHasConflict(true)
      } else {
        applyApiValidationErrors(error, methods.setError, {
          is_enabled: 'isEnabled',
          amount_per_point: 'amountPerPoint',
          redeem_points: 'redeemPoints',
          redeem_amount: 'redeemAmount',
          max_redeem_percent: 'maxRedeemPercent',
          min_redeem_points: 'minRedeemPoints',
          validity_months: 'validityMonths',
          expiry_warning_days: 'expiryWarningDays',
        })
      }
    } finally {
      submissionLockRef.current = false
      setPendingDisable(null)
    }
  }

  const handleSubmit = async (
    submittedValues: LoyaltySettingsFormValues,
    methods: UseFormReturn<LoyaltySettingsFormValues>
  ) => {
    if (settings.isEnabled && !submittedValues.isEnabled) {
      setPendingDisable({ values: submittedValues, methods })
      return
    }
    await submitValues(submittedValues, methods)
  }

  const locale = resolveAppLocale(i18n.language)
  const launchDate = formatDateTime(settings.launchDate, { locale }) || t('loyalty.values.notLaunched')

  return (
    <>
      <FormWrapper<LoyaltySettingsFormValues>
        schema={schema}
        defaultValues={values}
        resetValues={values}
        resetValuesKey={settings.versionId ?? 'initial'}
        validationMode="onChange"
        submissionDisabled={isSubmitting}
        onFormStateChange={setFormState}
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {hasConflict ? (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-lg border border-warning bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-warning" />
              <p className="text-sm">{t('loyalty.conflict.message')}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => void onReloadConflict()}>
              <RefreshCcw aria-hidden />
              {t('loyalty.conflict.reload')}
            </Button>
          </div>
        ) : null}

        <DashboardCard padding="lg" className="space-y-1">
          <h2 className="text-sm font-medium text-muted-foreground">{t('loyalty.fields.launchDate')}</h2>
          <p>
            <time dateTime={settings.launchDate ?? undefined}>{launchDate}</time>
          </p>
        </DashboardCard>

        <SettingsFields isSubmitting={isSubmitting} />
        <LoyaltyPreviewCard />
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting || !formState.isDirty || !formState.isValid}>
            {isSubmitting ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
            {isSubmitting ? t('loyalty.actions.saving') : t('loyalty.actions.save')}
          </Button>
        </div>
      </FormWrapper>

      <AlertDialog open={Boolean(pendingDisable)} onOpenChange={(open) => !open && setPendingDisable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('loyalty.disable.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('loyalty.disable.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
            <li>{t('loyalty.disable.noEarning')}</li>
            <li>{t('loyalty.disable.noRedemption')}</li>
            <li>{t('loyalty.disable.balancesRetained')}</li>
            <li>{t('loyalty.disable.expiryContinues')}</li>
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('loyalty.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDisable) void submitValues(pendingDisable.values, pendingDisable.methods, true)
              }}
            >
              {t('loyalty.disable.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
