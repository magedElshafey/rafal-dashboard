import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '@/store/auth'
import { canAccessAffiliate, permitsAffiliateAction } from './affiliate-access'
const gates = vi.hoisted(() => ({ release: true, financial: true }))
vi.mock('./affiliate-feature', () => ({
  get isAffiliateFeatureEnabled() {
    return gates.release
  },
  isAffiliatePayoutFeatureEnabled: true,
  get isAffiliatePayoutDecisionReady() {
    return gates.financial
  },
  isAffiliateSettingsWriteReady: true,
}))
const names = ['affiliates.view', 'affiliates.manage', 'affiliates.settings.manage', 'affiliates.payouts.process']
beforeEach(() => {
  gates.release = true
  gates.financial = true
  useAuth.setState({ token: 'synthetic', isAuthenticated: true, effectivePermissions: null })
})
describe('verified Affiliate access preparation', () => {
  it.each(Array.from({ length: 16 }, (_, i) => i))('checks independent grants subset %s', (mask) => {
    const grants = names.filter((_, i) => mask & (1 << i))
    expect(permitsAffiliateAction(grants, 'view')).toBe(Boolean(mask & 1))
    expect(permitsAffiliateAction(grants, 'manage')).toBe(Boolean(mask & 2))
    expect(permitsAffiliateAction(grants, 'settingsRead')).toBe(Boolean(mask & 5))
    expect(permitsAffiliateAction(grants, 'settingsWrite')).toBe(Boolean(mask & 4))
    expect(permitsAffiliateAction(grants, 'payoutDecision')).toBe(Boolean(mask & 8))
  })
  it('distinguishes unknown from verified empty, rejects stale hydration and never persists grants', () => {
    expect(useAuth.getState().effectivePermissions).toBeNull()
    expect(canAccessAffiliate('view')).toBe(false)
    useAuth.getState().setVerifiedPermissions('stale', names)
    expect(useAuth.getState().effectivePermissions).toBeNull()
    useAuth.getState().setVerifiedPermissions('synthetic', [])
    expect(useAuth.getState().effectivePermissions).toEqual([])
    expect(canAccessAffiliate('view')).toBe(false)
    useAuth.getState().setVerifiedPermissions('synthetic', ['Super Admin'])
    expect(canAccessAffiliate('manage')).toBe(false)
    useAuth.getState().setVerifiedPermissions('synthetic', names)
    expect(canAccessAffiliate('view')).toBe(true)
    gates.financial = false
    expect(canAccessAffiliate('payoutDecision')).toBe(false)
    gates.release = false
    expect(canAccessAffiliate('view')).toBe(false)
    useAuth.getState().logout()
    expect(useAuth.getState().effectivePermissions).toBeNull()
  })
})
