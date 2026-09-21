import * as yup from 'yup'

import type { SettingsFormValues } from '@/modules/settings/types/settings.types'

export type SettingsValidationMessages = {
  required: string
  validNumber: string
  nonNegative: string
  integer: string
  minimumOne: string
  vatRange: string
}

function numberField(messages: SettingsValidationMessages) {
  return yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? Number.NaN : value))
    .typeError(messages.validNumber)
    .required(messages.required)
    .test('finite', messages.validNumber, Number.isFinite)
}

export function createSettingsSchema(messages: SettingsValidationMessages) {
  return yup.object<SettingsFormValues>({
    vatRate: numberField(messages).min(0, messages.vatRange).max(100, messages.vatRange),
    freeShippingEnabled: yup.boolean().required(messages.required).defined(),
    freeShippingThreshold: numberField(messages).min(0, messages.nonNegative),
    giftWrapEnabled: yup.boolean().required(messages.required).defined(),
    giftWrapFee: numberField(messages).min(0, messages.nonNegative),
    maxAddressesPerUser: numberField(messages).integer(messages.integer).min(1, messages.minimumOne),
    maxCartItemQuantity: numberField(messages).integer(messages.integer).min(1, messages.minimumOne),
    otpResendCooldownSeconds: numberField(messages).integer(messages.integer).min(0, messages.nonNegative),
  })
}
