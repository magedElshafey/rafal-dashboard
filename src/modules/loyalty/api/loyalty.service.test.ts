import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  loyaltyService,
  serializeLoyaltyAdjustment,
  serializeLoyaltySettingsUpdate,
} from '@/modules/loyalty/api/loyalty.service'

const http = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), post: vi.fn() }))
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

    await loyaltyService.getVersions(2, 20)

    expect(http.get).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/dashboard/loyalty/settings/versions',
        query: { page: 2, per_page: 20 },
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

    const result = await loyaltyService.getVersions(1, 20)

    expect(result.items[0].values).toMatchObject({ validityMonths: null, expiryWarningDays: null })
  })

  it('normalizes an authoritative customer summary including nullable expiry data', async () => {
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: { available: 0, pending: 0, held: 0, expiring_soon: null, is_blocked: 1 },
      },
    })

    await expect(loyaltyService.getCustomerSummary(12)).resolves.toEqual({
      available: 0,
      pending: 0,
      held: 0,
      expiringSoon: null,
      isBlocked: true,
    })
    expect(http.get).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/customers/12/loyalty', suppressErrorNotification: true })
    )
  })

  it('normalizes ledger rows and sends only documented filters', async () => {
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [
          {
            id: 116,
            created_at: '2026-11-13T17:25:44+03:00',
            type: 'adjust_credit',
            label: 'Manual adjustment',
            bucket: 'available',
            points: 5000,
            lot_expires_at: null,
            actor_type: 'admin',
            actor_name: null,
            reason: null,
            reason_label: null,
            note: null,
            order: null,
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
      },
    })

    const result = await loyaltyService.getCustomerLedger(
      12,
      {
        type: 'adjust_credit',
        from: '2026-11-01',
        to: '2026-11-30',
      },
      2,
      50
    )

    expect(result.items[0]).toMatchObject({ id: 116, points: 5000, lotExpiresAt: null, order: null })
    expect(http.get).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/dashboard/customers/12/loyalty/ledger',
        query: { type: 'adjust_credit', from: '2026-11-01', to: '2026-11-30', page: 2, per_page: 50 },
      })
    )
  })

  it('rejects fractional ledger points instead of fabricating an integer balance movement', async () => {
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [
          {
            id: 1,
            created_at: '2026-11-13T17:25:44+03:00',
            type: 'adjust_credit',
            label: 'Manual adjustment',
            bucket: 'available',
            points: 1.5,
            lot_expires_at: null,
            actor_type: null,
            actor_name: null,
            reason: null,
            reason_label: null,
            note: null,
            order: null,
          },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
      },
    })

    await expect(loyaltyService.getCustomerLedger(12, { type: null, from: '', to: '' })).rejects.toThrow(
      'Ledger points is unavailable'
    )
  })

  it('serializes only the documented adjustment fields and returns the authoritative summary', async () => {
    const payload = {
      type: 'credit' as const,
      points: 5000,
      reason: 'customer_service' as const,
      note: 'Test credit for loyalty QA',
      notifyCustomer: false,
    }
    expect(serializeLoyaltyAdjustment(payload)).toEqual({
      type: 'credit',
      points: 5000,
      reason: 'customer_service',
      note: 'Test credit for loyalty QA',
      notify_customer: false,
    })
    http.post.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: { available: 5127, pending: 0, held: 0, expiring_soon: null, is_blocked: false },
      },
    })

    await expect(loyaltyService.adjustCustomerPoints(12, payload)).resolves.toEqual({
      available: 5127,
      pending: 0,
      held: 0,
      expiringSoon: null,
      isBlocked: false,
    })
    expect(http.post).toHaveBeenCalledExactlyOnceWith({
      url: '/dashboard/customers/12/loyalty/adjustments',
      data: {
        type: 'credit',
        points: 5000,
        reason: 'customer_service',
        note: 'Test credit for loyalty QA',
        notify_customer: false,
      },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
