// No effective-staff-grants source is available yet. No role/catalog inference or DEV bypass.
export const isAffiliateFeatureEnabled = false
export const isAffiliatePayoutFeatureEnabled = false
// Separate from read readiness: response interpretation and staging acceptance are unresolved.
export const isAffiliatePayoutDecisionReady = false
export const isAffiliateSettingsWriteReady = false

export type AffiliatePermission =
  'affiliates.view' | 'affiliates.manage' | 'affiliates.settings.manage' | 'affiliates.payouts.process'

export function hasAffiliatePermission(grants: readonly string[] | null, permission: AffiliatePermission) {
  return grants?.includes(permission) === true
}

export function canReadAffiliateSettings(grants: readonly string[] | null) {
  return (
    hasAffiliatePermission(grants, 'affiliates.view') || hasAffiliatePermission(grants, 'affiliates.settings.manage')
  )
}
