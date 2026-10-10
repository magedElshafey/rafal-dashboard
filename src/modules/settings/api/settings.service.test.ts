import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))

vi.mock('@/utils/http', () => ({
  $http: {
    get: httpMocks.get,
    put: httpMocks.put,
  },
}))

import { serializeSettingsUpdate, settingsService } from './settings.service'

const rawSettings = {
  vat_rate: 15,
  free_shipping_enabled: 1 as const,
  free_shipping_threshold: null,
  gift_wrap_enabled: false,
  gift_wrap_fee: 15,
  max_addresses_per_user: 10,
  max_cart_item_quantity: 10,
  otp_resend_cooldown_seconds: 1,
  guest_order_verification_minutes: 30,
  low_stock_threshold: 5,
  return_window_days: 14,
}

describe('settingsService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes GET response fields and defensive boolean wire values', async () => {
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: rawSettings } })
    await expect(settingsService.get()).resolves.toEqual({
      vatRate: 15,
      freeShippingEnabled: true,
      freeShippingThreshold: null,
      giftWrapEnabled: false,
      giftWrapFee: 15,
      maxAddressesPerUser: 10,
      otpResendCooldownSeconds: 1,
      guestOrderVerificationMinutes: 30,
      lowStockThreshold: 5,
      returnWindowDays: 14,
    })
    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/settings',
      signal: undefined,
      suppressErrorNotification: true,
    })
  })

  it('rejects missing singleton data instead of fabricating defaults', async () => {
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: null } })
    await expect(settingsService.get()).rejects.toThrow('Settings data is unavailable')
  })

  it.each([
    ['vatRate', 18, { vat_rate: 18 }],
    ['freeShippingEnabled', true, { free_shipping_enabled: 1 }],
    ['freeShippingEnabled', false, { free_shipping_enabled: 0 }],
    ['freeShippingThreshold', 250, { free_shipping_threshold: 250 }],
    ['giftWrapEnabled', true, { gift_wrap_enabled: 1 }],
    ['giftWrapEnabled', false, { gift_wrap_enabled: 0 }],
    ['giftWrapFee', 20, { gift_wrap_fee: 20 }],
    ['maxAddressesPerUser', 12, { max_addresses_per_user: 12 }],
    ['otpResendCooldownSeconds', 30, { otp_resend_cooldown_seconds: 30 }],
    ['guestOrderVerificationMinutes', 45, { guest_order_verification_minutes: 45 }],
    ['lowStockThreshold', 4, { low_stock_threshold: 4 }],
    ['returnWindowDays', 30, { return_window_days: 30 }],
  ] as const)('serializes only %s', (field, value, expected) => {
    expect(serializeSettingsUpdate({ [field]: value })).toEqual(expected)
  })

  it('PUTs exact partial JSON without FormData or untouched fields', async () => {
    httpMocks.put.mockResolvedValue({
      data: { success: true, message: 'updated', data: { ...rawSettings, gift_wrap_enabled: 0, gift_wrap_fee: 0 } },
    })
    const updated = await settingsService.update({ giftWrapEnabled: false, giftWrapFee: 0 })
    expect(httpMocks.put).toHaveBeenCalledWith({
      url: '/dashboard/settings',
      data: { gift_wrap_enabled: 0, gift_wrap_fee: 0 },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect(httpMocks.put.mock.calls[0][0].data).not.toBeInstanceOf(FormData)
    expect(updated).toEqual({
      vatRate: 15,
      freeShippingEnabled: true,
      freeShippingThreshold: null,
      giftWrapEnabled: false,
      giftWrapFee: 0,
      maxAddressesPerUser: 10,
      otpResendCooldownSeconds: 1,
      guestOrderVerificationMinutes: 30,
      lowStockThreshold: 5,
      returnWindowDays: 14,
    })
  })

  it('serializes the confirmed disabled Free Shipping values as partial JSON', () => {
    expect(serializeSettingsUpdate({ freeShippingEnabled: false, freeShippingThreshold: null })).toEqual({
      free_shipping_enabled: 0,
      free_shipping_threshold: null,
    })
  })

  it('never serializes the legacy cart quantity setting', () => {
    expect(serializeSettingsUpdate({ maxAddressesPerUser: 12 })).not.toHaveProperty('max_cart_item_quantity')
  })
})
