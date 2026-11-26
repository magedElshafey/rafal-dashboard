import { useAuth } from '@/store/auth'
import {
  isAffiliateFeatureEnabled,
  isAffiliatePayoutFeatureEnabled,
  isAffiliatePayoutDecisionReady,
  isAffiliateSettingsWriteReady,
} from './affiliate-feature'

export type AffiliateAction = 'view' | 'manage' | 'settingsRead' | 'settingsWrite' | 'payouts' | 'payoutDecision'
export function permitsAffiliateAction(grants: readonly string[] | null, action: AffiliateAction): boolean {
  if (!grants) return false
  const has = (name: string) => grants.includes(`affiliates.${name}`)
  switch (action) {
    case 'view':
      return has('view')
    case 'manage':
      return has('manage')
    case 'settingsRead':
      return has('view') || has('settings.manage')
    case 'settingsWrite':
      return has('settings.manage')
    case 'payouts':
    case 'payoutDecision':
      return has('payouts.process')
  }
}
export function affiliateActionReleased(action: AffiliateAction) {
  return (
    isAffiliateFeatureEnabled &&
    (!['payouts', 'payoutDecision'].includes(action) || isAffiliatePayoutFeatureEnabled) &&
    (action !== 'payoutDecision' || isAffiliatePayoutDecisionReady) &&
    (action !== 'settingsWrite' || isAffiliateSettingsWriteReady)
  )
}
export function canAccessAffiliate(action: AffiliateAction) {
  const state = useAuth.getState()
  return (
    state.isAuthenticated &&
    affiliateActionReleased(action) &&
    permitsAffiliateAction(state.effectivePermissions, action)
  )
}
export function useAffiliateAccess(action: AffiliateAction) {
  return useAuth(
    (state) =>
      state.isAuthenticated &&
      affiliateActionReleased(action) &&
      permitsAffiliateAction(state.effectivePermissions, action)
  )
}
