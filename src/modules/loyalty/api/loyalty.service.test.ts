import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loyaltyService, serializeLoyaltySettingsUpdate } from '@/modules/loyalty/api/loyalty.service'

const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))

const rawSettings = {
  version_id: 27,
  is_enabled: true,
  amount_per_point: '10.00',
  redeem_points: 100,
  redeem_amount: '5.00',
  max_redeem_percent: 50,
  min_redeem_points: 100,
  validity_months: 12,
  expiry_warning_days: 30,
  value_per_point: 0.05,
  effective_return_percent: 0.5,
  launch_date: '2026-11-11T21:23:22+03:00',
  saved_at: '2026-11-11T21:30:08+03:00',
}

const rawInitialSettings = {
  ...rawSettings,
  version_id: null,
  is_enabled: false,
  validity_months: null,
  expiry_warning_days: null,
  launch_date: null,
  saved_at: null,
}

describe('loyaltyService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes decimal strings without changing their API precision', async () => {
    http.get.mockResolvedValue({ data: { success: true, message: 'ok', data: rawSettings } })

    const settings = await loyaltyService.getSettings()

    expect(settings).toMatchObject({ versionId: 27, amountPerPoint: '10.00', redeemAmount: '5.00' })
    expect(http.get).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/loyalty/settings', suppressErrorNotification: true })
    )
  })

  it('normalizes the exact valid unconfigured settings response without fabricating defaults', async () => {
    http.get.mockResolvedValue({ data: { success: true, message: 'ok', data: rawInitialSettings } })

    await expect(loyaltyService.getSettings()).resolves.toEqual({
      versionId: null,
      isEnabled: false,
      amountPerPoint: '10.00',
      redeemPoints: 100,
      redeemAmount: '5.00',
      maxRedeemPercent: 50,
      minRedeemPoints: 100,
      validityMonths: null,
      expiryWarningDays: null,
      valuePerPoint: 0.05,
      effectiveReturnPercent: 0.5,
      launchDate: null,
      savedAt: null,
    })
  })

  it('serializes only documented settings fields and confirms disable explicitly', async () => {
    const payload = {
      versionId: 27,
      isEnabled: false,
      amountPerPoint: 11,
      redeemPoints: 100,
      redeemAmount: 5,
      maxRedeemPercent: 50,
      minRedeemPoints: 100,
      validityMonths: 12,
      expiryWarningDays: 30,
      confirmDisable: true as const,
    }

    expect(serializeLoyaltySettingsUpdate(payload)).toEqual({
      version_id: 27,
      is_enabled: false,
      amount_per_point: 11,
      redeem_points: 100,
      redeem_amount: 5,
      max_redeem_percent: 50,
      min_redeem_points: 100,
      validity_months: 12,
      expiry_warning_days: 30,
      confirm_disable: true,
    })
    expect(serializeLoyaltySettingsUpdate(payload)).not.toHaveProperty('guest_claim_days')
  })

  it('preserves a null version ID for the initial save', () => {
    expect(
      serializeLoyaltySettingsUpdate({
        versionId: null,
        isEnabled: true,
        amountPerPoint: 10,
        redeemPoints: 100,
        redeemAmount: 5,
        maxRedeemPercent: 50,
        minRedeemPoints: 100,
        validityMonths: 12,
        expiryWarningDays: 30,
      }).version_id
    ).toBeNull()
  })

  it('requests version history only with the documented page size', async () => {
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
      },
    })

    await loyaltyService.getVersions(20)

    expect(http.get).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/dashboard/loyalty/settings/versions',
        query: { per_page: 20 },
      })
    )
  })

  it('normalizes nullable expiry values in version history', async () => {
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [
          {
            id: 1,
            saved_at: '2026-11-13T17:23:02+03:00',
            admin: { id: 1, name: 'Admin' },
            values: {
              is_enabled: false,
              amount_per_point: '10.00',
              redeem_points: 100,
              redeem_amount: '5.00',
              max_redeem_percent: 50,
              min_redeem_points: 100,
              validity_months: null,
              expiry_warning_days: null,
              effective_return_percent: 0.5,
            },
            previous_values: null,
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 },
      },
    })

    const result = await loyaltyService.getVersions(20)

    expect(result.items[0].values).toMatchObject({ validityMonths: null, expiryWarningDays: null })
  })
})
