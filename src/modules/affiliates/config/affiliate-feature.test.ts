import { describe, expect, it } from 'vitest'
import {
  canReadAffiliateSettings,
  hasAffiliatePermission,
  isAffiliateFeatureEnabled,
  isAffiliateSettingsWriteReady,
  isAffiliatePayoutDecisionReady,
  isAffiliatePayoutFeatureEnabled,
} from './affiliate-feature'
const names = [
  'affiliates.view',
  'affiliates.manage',
  'affiliates.settings.manage',
  'affiliates.payouts.process',
] as const
describe('Affiliate exact grants and readiness', () => {
  it('keeps production/development access and unsafe settings writes closed', () => {
    expect(isAffiliateFeatureEnabled).toBe(false)
    expect(isAffiliateSettingsWriteReady).toBe(false)
    expect(isAffiliatePayoutDecisionReady).toBe(false)
    expect(isAffiliatePayoutFeatureEnabled).toBe(false)
  })
  it('denies unknown/catalog role names', () => {
    expect(canReadAffiliateSettings(null)).toBe(false)
    expect(hasAffiliatePermission(['Super Admin'], 'affiliates.manage')).toBe(false)
  })
  it.each(Array.from({ length: 16 }, (_, i) => i))('checks exact grants for subset %s', (mask) => {
    const grants = names.filter((_, i) => mask & (1 << i))
    names.forEach((name) => expect(hasAffiliatePermission(grants, name)).toBe(grants.includes(name)))
    expect(canReadAffiliateSettings(grants)).toBe(
      grants.includes('affiliates.view') || grants.includes('affiliates.settings.manage')
    )
  })
})
