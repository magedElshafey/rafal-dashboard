import type { FieldNamesMarkedBoolean } from 'react-hook-form'

import type { SettingsFormValues, SettingsUpdatePayload } from '@/modules/settings/types/settings.types'

const SETTINGS_FIELDS = [
  'vatRate',
  'freeShippingEnabled',
  'freeShippingThreshold',
  'giftWrapEnabled',
  'giftWrapFee',
  'maxAddressesPerUser',
  'maxCartItemQuantity',
  'otpResendCooldownSeconds',
] as const

export function buildSettingsUpdatePayload(
  values: SettingsFormValues,
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<SettingsFormValues>>>
): SettingsUpdatePayload {
  const payload: SettingsUpdatePayload = {}
  SETTINGS_FIELDS.forEach((field) => {
    if (dirtyFields[field]) Object.assign(payload, { [field]: values[field] })
  })

  if (dirtyFields.freeShippingEnabled && !values.freeShippingEnabled) {
    payload.freeShippingThreshold = 0
  }
  if (dirtyFields.giftWrapEnabled && !values.giftWrapEnabled) {
    payload.giftWrapFee = 0
  }

  return payload
}
