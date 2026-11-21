import { afterEach, describe, expect, it, vi } from 'vitest'

describe('Affiliate feature gate', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('stays disabled outside Vite development even when mock configuration exists', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_AFFILIATE_MOCK_API_BASE_URL', 'http://127.0.0.1:4100')
    vi.stubEnv('VITE_AFFILIATE_MOCK_TOKEN', 'mock-staff-authorized')
    const { isAffiliateFeatureEnabled } = await import('@/modules/affiliates/config/affiliate-feature')
    expect(isAffiliateFeatureEnabled).toBe(false)
  })

  it('requires both Affiliate-specific mock settings in development', async () => {
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_AFFILIATE_MOCK_API_BASE_URL', 'http://127.0.0.1:4100')
    vi.stubEnv('VITE_AFFILIATE_MOCK_TOKEN', '')
    const { isAffiliateFeatureEnabled } = await import('@/modules/affiliates/config/affiliate-feature')
    expect(isAffiliateFeatureEnabled).toBe(false)
  })
})
