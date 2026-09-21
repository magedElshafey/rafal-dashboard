import { describe, expect, it } from 'vitest'

import type { SettingsFormValues } from '@/modules/settings/types/settings.types'
import { buildSettingsUpdatePayload } from './settings.utils'

const values: SettingsFormValues = {
  vatRate: 15,
  freeShippingEnabled: true,
  freeShippingThreshold: 500,
  giftWrapEnabled: true,
  giftWrapFee: 15,
  maxAddressesPerUser: 10,
  maxCartItemQuantity: 10,
  otpResendCooldownSeconds: 1,
}

describe('buildSettingsUpdatePayload', () => {
  it('includes only dirty domain fields', () => {
    expect(buildSettingsUpdatePayload({ ...values, vatRate: 20 }, { vatRate: true })).toEqual({ vatRate: 20 })
    expect(buildSettingsUpdatePayload({ ...values, maxCartItemQuantity: 12 }, { maxCartItemQuantity: true })).toEqual({
      maxCartItemQuantity: 12,
    })
  })

  it('includes required dependent zeros when toggles are turned off', () => {
    expect(
      buildSettingsUpdatePayload(
        { ...values, freeShippingEnabled: false, freeShippingThreshold: 0 },
        { freeShippingEnabled: true, freeShippingThreshold: true }
      )
    ).toEqual({ freeShippingEnabled: false, freeShippingThreshold: 0 })
    expect(
      buildSettingsUpdatePayload(
        { ...values, giftWrapEnabled: false, giftWrapFee: 0 },
        { giftWrapEnabled: true, giftWrapFee: true }
      )
    ).toEqual({ giftWrapEnabled: false, giftWrapFee: 0 })
  })
})
