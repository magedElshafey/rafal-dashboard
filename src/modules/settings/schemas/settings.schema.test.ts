import { describe, expect, it } from 'vitest'

import type { SettingsFormValues } from '@/modules/settings/types/settings.types'
import { createSettingsSchema } from './settings.schema'

const schema = createSettingsSchema({
  required: 'required',
  validNumber: 'number',
  nonNegative: 'non-negative',
  integer: 'integer',
  minimumOne: 'minimum-one',
  vatRange: 'vat-range',
})

const valid: SettingsFormValues = {
  vatRate: 15,
  freeShippingEnabled: true,
  freeShippingThreshold: 500,
  giftWrapEnabled: true,
  giftWrapFee: 15,
  maxAddressesPerUser: 10,
  maxCartItemQuantity: 10,
  otpResendCooldownSeconds: 1,
}

describe('Settings validation', () => {
  it.each([0, 15, 15.5, 100])('accepts VAT %s', async (vatRate) => {
    await expect(schema.isValid({ ...valid, vatRate })).resolves.toBe(true)
  })

  it.each([-1, 101, Number.POSITIVE_INFINITY])('rejects VAT %s', async (vatRate) => {
    await expect(schema.isValid({ ...valid, vatRate })).resolves.toBe(false)
  })

  it.each([
    ['freeShippingThreshold', 0, true],
    ['freeShippingThreshold', 12.5, true],
    ['freeShippingThreshold', -1, false],
    ['giftWrapFee', 0, true],
    ['giftWrapFee', 5.5, true],
    ['giftWrapFee', -1, false],
    ['maxAddressesPerUser', 1, true],
    ['maxAddressesPerUser', 0, false],
    ['maxAddressesPerUser', 1.5, false],
    ['maxCartItemQuantity', 1, true],
    ['maxCartItemQuantity', 0, false],
    ['maxCartItemQuantity', 1.5, false],
    ['otpResendCooldownSeconds', 0, true],
    ['otpResendCooldownSeconds', 30, true],
    ['otpResendCooldownSeconds', -1, false],
    ['otpResendCooldownSeconds', 1.5, false],
  ] as const)('validates %s = %s', async (field, value, expected) => {
    await expect(schema.isValid({ ...valid, [field]: value })).resolves.toBe(expected)
  })

  it.each(Object.keys(valid) as Array<keyof SettingsFormValues>)('requires %s', async (field) => {
    await expect(schema.isValid({ ...valid, [field]: undefined })).resolves.toBe(false)
  })
})
