import type {
  AffiliateSettings,
  AffiliateSettingsFormValues,
  UpdateAffiliateSettingsPayload,
} from '../types/affiliate.types'
export function toAffiliateSettingsFormValues(settings: AffiliateSettings): AffiliateSettingsFormValues {
  return {
    programEnabled: settings.programEnabled,
    applicationsEnabled: settings.applicationsEnabled,
    customerDiscountPercentage: settings.customerDiscountPercentage,
    affiliateCommissionPercentage: settings.affiliateCommissionPercentage,
    minimumPayoutAmount: settings.minimumPayoutAmount,
    termsPageId: settings.termsPageId,
  }
}
export function buildAffiliateSettingsPayload(
  _baseline: AffiliateSettings,
  values: AffiliateSettingsFormValues
): UpdateAffiliateSettingsPayload {
  return { ...toAffiliateSettingsFormValues(values), minimumPayoutAmount: values.minimumPayoutAmount.trim() }
}
