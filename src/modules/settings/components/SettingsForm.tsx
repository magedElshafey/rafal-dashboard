import { useMemo, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useFormContext, useWatch, type UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form'
import { FormSwitch } from '@/components/form/FormSwitch'
import { DashboardCard } from '@/components/shared/dashboard/atoms/DashboardCard'
import { Button } from '@/components/ui/button'
import { createSettingsSchema } from '@/modules/settings/schemas/settings.schema'
import type { Settings, SettingsFormValues, SettingsUpdatePayload } from '@/modules/settings/types/settings.types'
import { buildSettingsUpdatePayload } from '@/modules/settings/utils/settings.utils'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

type SettingsFormProps = {
  settings: Settings
  isSubmitting: boolean
  onSubmit: (payload: SettingsUpdatePayload) => Promise<Settings>
}

type SettingsSectionProps = {
  title: string
  description: string
  children: React.ReactNode
}

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <DashboardCard className="space-y-5" padding="lg">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </DashboardCard>
  )
}

function SettingsFields({ isSubmitting }: { isSubmitting: boolean }) {
  const { t } = useTranslation()
  const { control, setValue } = useFormContext<SettingsFormValues>()
  const freeShippingEnabled = useWatch({ control, name: 'freeShippingEnabled' })
  const giftWrapEnabled = useWatch({ control, name: 'giftWrapEnabled' })

  const zeroDependentField = (field: 'freeShippingThreshold' | 'giftWrapFee', enabled: boolean) => {
    if (!enabled) setValue(field, 0, { shouldDirty: true, shouldValidate: true, shouldTouch: true })
  }

  return (
    <div className="space-y-5">
      <SettingsSection title={t('settings.sections.tax.title')} description={t('settings.sections.tax.description')}>
        <FormInput
          name="vatRate"
          label={t('settings.fields.vatRate')}
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="any"
          suffix={<span className="text-sm text-muted-foreground">%</span>}
          disabled={isSubmitting}
          required
        />
      </SettingsSection>

      <SettingsSection
        title={t('settings.sections.shipping.title')}
        description={t('settings.sections.shipping.description')}
      >
        <FormSwitch
          name="freeShippingEnabled"
          label={t('settings.fields.freeShippingEnabled')}
          disabled={isSubmitting}
          onChange={(enabled) => zeroDependentField('freeShippingThreshold', enabled)}
        />
        <FormInput
          name="freeShippingThreshold"
          label={t('settings.fields.freeShippingThreshold')}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          suffix={<span className="text-xs text-muted-foreground">{t('settings.units.currency')}</span>}
          disabled={isSubmitting || !freeShippingEnabled}
          required
        />
      </SettingsSection>

      <SettingsSection
        title={t('settings.sections.giftWrap.title')}
        description={t('settings.sections.giftWrap.description')}
      >
        <FormSwitch
          name="giftWrapEnabled"
          label={t('settings.fields.giftWrapEnabled')}
          disabled={isSubmitting}
          onChange={(enabled) => zeroDependentField('giftWrapFee', enabled)}
        />
        <FormInput
          name="giftWrapFee"
          label={t('settings.fields.giftWrapFee')}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          suffix={<span className="text-xs text-muted-foreground">{t('settings.units.currency')}</span>}
          disabled={isSubmitting || !giftWrapEnabled}
          required
        />
      </SettingsSection>

      <SettingsSection
        title={t('settings.sections.customerLimits.title')}
        description={t('settings.sections.customerLimits.description')}
      >
        <FormInput
          name="maxAddressesPerUser"
          label={t('settings.fields.maxAddressesPerUser')}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          disabled={isSubmitting}
          required
        />
        <FormInput
          name="maxCartItemQuantity"
          label={t('settings.fields.maxCartItemQuantity')}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          disabled={isSubmitting}
          required
        />
      </SettingsSection>

      <SettingsSection
        title={t('settings.sections.security.title')}
        description={t('settings.sections.security.description')}
      >
        <FormInput
          name="otpResendCooldownSeconds"
          label={t('settings.fields.otpResendCooldownSeconds')}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          suffix={<span className="text-sm text-muted-foreground">{t('settings.units.seconds')}</span>}
          disabled={isSubmitting}
          required
        />
      </SettingsSection>
    </div>
  )
}

export function SettingsForm({ settings, isSubmitting, onSubmit }: SettingsFormProps) {
  const { t } = useTranslation()
  const [formState, setFormState] = useState({ isDirty: false, isValid: false })
  const submissionLockRef = useRef(false)
  const schema = useMemo(
    () =>
      createSettingsSchema({
        required: t('settings.validation.required'),
        validNumber: t('settings.validation.validNumber'),
        nonNegative: t('settings.validation.nonNegative'),
        integer: t('settings.validation.integer'),
        minimumOne: t('settings.validation.minimumOne'),
        vatRange: t('settings.validation.vatRange'),
      }),
    [t]
  )

  const handleSubmit = async (values: SettingsFormValues, methods: UseFormReturn<SettingsFormValues>) => {
    if (submissionLockRef.current) return
    submissionLockRef.current = true
    try {
      const payload = buildSettingsUpdatePayload(values, methods.formState.dirtyFields)
      const updated = await onSubmit(payload)
      methods.reset(updated)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, {
        vat_rate: 'vatRate',
        free_shipping_enabled: 'freeShippingEnabled',
        free_shipping_threshold: 'freeShippingThreshold',
        gift_wrap_enabled: 'giftWrapEnabled',
        gift_wrap_fee: 'giftWrapFee',
        max_addresses_per_user: 'maxAddressesPerUser',
        max_cart_item_quantity: 'maxCartItemQuantity',
        otp_resend_cooldown_seconds: 'otpResendCooldownSeconds',
      })
    } finally {
      submissionLockRef.current = false
    }
  }

  return (
    <FormWrapper<SettingsFormValues>
      schema={schema}
      defaultValues={settings}
      resetValues={settings}
      resetValuesKey={JSON.stringify(settings)}
      validationMode="onChange"
      submissionDisabled={isSubmitting}
      onFormStateChange={setFormState}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <SettingsFields isSubmitting={isSubmitting} />
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting || !formState.isDirty || !formState.isValid}>
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {isSubmitting ? t('settings.actions.saving') : t('settings.actions.save')}
        </Button>
      </div>
    </FormWrapper>
  )
}
