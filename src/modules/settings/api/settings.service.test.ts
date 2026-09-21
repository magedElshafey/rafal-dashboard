import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))

vi.mock('@/config/env', () => ({ default: { SETTINGS_USE_MOCK: false } }))
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
  free_shipping_threshold: 500,
  gift_wrap_enabled: false,
  gift_wrap_fee: 15,
  max_addresses_per_user: 10,
  max_cart_item_quantity: 10,
  otp_resend_cooldown_seconds: 1,
}

describe('settingsService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes GET response fields and defensive boolean wire values', async () => {
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: rawSettings } })
    await expect(settingsService.get()).resolves.toEqual({
      vatRate: 15,
      freeShippingEnabled: true,
      freeShippingThreshold: 500,
      giftWrapEnabled: false,
      giftWrapFee: 15,
      maxAddressesPerUser: 10,
      maxCartItemQuantity: 10,
      otpResendCooldownSeconds: 1,
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
    ['maxCartItemQuantity', 14, { max_cart_item_quantity: 14 }],
    ['otpResendCooldownSeconds', 30, { otp_resend_cooldown_seconds: 30 }],
  ] as const)('serializes only %s', (field, value, expected) => {
    expect(serializeSettingsUpdate({ [field]: value })).toEqual(expected)
  })

  it('PUTs exact partial JSON without FormData or untouched fields', async () => {
    httpMocks.put.mockResolvedValue({
      data: { success: true, message: 'updated', data: { ...rawSettings, gift_wrap_enabled: 0, gift_wrap_fee: 0 } },
    })
    await settingsService.update({ giftWrapEnabled: false, giftWrapFee: 0 })
    expect(httpMocks.put).toHaveBeenCalledWith({
      url: '/dashboard/settings',
      data: { gift_wrap_enabled: 0, gift_wrap_fee: 0 },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect(httpMocks.put.mock.calls[0][0].data).not.toBeInstanceOf(FormData)
  })
})
