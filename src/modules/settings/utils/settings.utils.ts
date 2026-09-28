import type { FieldNamesMarkedBoolean } from 'react-hook-form'

import type { SettingsFormValues, SettingsUpdatePayload } from '@/modules/settings/types/settings.types'

export function buildSettingsUpdatePayload(
  values: SettingsFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<SettingsFormValues>>>
): SettingsUpdatePayload {
  const payload: SettingsUpdatePayload = {}
  if (dirtyFields.vatRate) payload.vatRate = values.vatRate
  if (dirtyFields.freeShippingEnabled) payload.freeShippingEnabled = values.freeShippingEnabled
  if (dirtyFields.freeShippingThreshold) payload.freeShippingThreshold = values.freeShippingThreshold
  if (dirtyFields.giftWrapEnabled) payload.giftWrapEnabled = values.giftWrapEnabled
  if (dirtyFields.giftWrapFee && values.giftWrapFee !== null) payload.giftWrapFee = values.giftWrapFee
  if (dirtyFields.maxAddressesPerUser) payload.maxAddressesPerUser = values.maxAddressesPerUser
  if (dirtyFields.maxCartItemQuantity) payload.maxCartItemQuantity = values.maxCartItemQuantity
  if (dirtyFields.otpResendCooldownSeconds) {
    payload.otpResendCooldownSeconds = values.otpResendCooldownSeconds
  }
  if (dirtyFields.guestOrderVerificationMinutes) {
    payload.guestOrderVerificationMinutes = values.guestOrderVerificationMinutes
  }
  if (dirtyFields.lowStockThreshold) payload.lowStockThreshold = values.lowStockThreshold
  if (dirtyFields.returnWindowDays) payload.returnWindowDays = values.returnWindowDays

  if (dirtyFields.freeShippingEnabled && !values.freeShippingEnabled) {
    payload.freeShippingThreshold = null
  }
  if (dirtyFields.giftWrapEnabled && !values.giftWrapEnabled) {
    payload.giftWrapFee = 0
  }

  return payload
}
