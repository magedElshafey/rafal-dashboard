import type {
  AffiliateSettings,
  AffiliateSettingsFormValues,
  UpdateAffiliateSettingsPayload,
} from '@/modules/affiliates/types/affiliate.types'

export function toAffiliateSettingsFormValues(settings: AffiliateSettings): AffiliateSettingsFormValues {
  return {
    programEnabled: settings.programEnabled,
    applicationsEnabled: settings.applicationsEnabled,
    customerDiscountPercentage: settings.customerDiscountPercentage,
    affiliateCommissionPercentage: settings.affiliateCommissionPercentage,
    minimumPayoutAmount: settings.minimumPayoutAmount,
    termsPageReference: settings.termsPageReference,
  }
}

export function normalizeAffiliateSettingsFormValues(values: AffiliateSettingsFormValues): AffiliateSettingsFormValues {
  return {
    ...values,
    customerDiscountPercentage: Number(values.customerDiscountPercentage),
    affiliateCommissionPercentage: Number(values.affiliateCommissionPercentage),
    minimumPayoutAmount: values.minimumPayoutAmount.trim(),
    termsPageReference: values.termsPageReference.trim(),
  }
}

export function buildAffiliateSettingsPayload(
  baseline: AffiliateSettings,
  formValues: AffiliateSettingsFormValues
): UpdateAffiliateSettingsPayload | null {
  const values = normalizeAffiliateSettingsFormValues(formValues)
  const payload: UpdateAffiliateSettingsPayload = { version: baseline.version }
  const baselineValues = toAffiliateSettingsFormValues(baseline)
  const keys = Object.keys(values) as (keyof AffiliateSettingsFormValues)[]
  keys.forEach((key) => {
    if (!Object.is(values[key], baselineValues[key])) {
      Object.assign(payload, { [key]: values[key] })
    }
  })
  return Object.keys(payload).length > 1 ? payload : null
}
