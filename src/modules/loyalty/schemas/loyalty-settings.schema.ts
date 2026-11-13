import * as yup from 'yup'

import type { LoyaltySettingsFormValues } from '@/modules/loyalty/types/loyalty.types'

export type LoyaltyValidationMessages = {
  required: string
  validNumber: string
  integer: string
  amountPerPointRange: string
  redeemPointsRange: string
  redeemAmountRange: string
  percentRange: string
  minimumPointsRange: string
  validityRange: string
  warningRange: string
  warningBeforeValidity: string
  twoDecimals: string
}

function numberField(messages: LoyaltyValidationMessages) {
  return yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? Number.NaN : value))
    .typeError(messages.validNumber)
    .required(messages.required)
    .test('finite', messages.validNumber, Number.isFinite)
}

function decimalField(messages: LoyaltyValidationMessages) {
  return numberField(messages).test(
    'two-decimals',
    messages.twoDecimals,
    (value) => value === undefined || Math.abs(value * 100 - Math.round(value * 100)) < Number.EPSILON * 100
  )
}

export function createLoyaltySettingsSchema(messages: LoyaltyValidationMessages) {
  return yup.object<LoyaltySettingsFormValues>({
    isEnabled: yup.boolean().required(messages.required).defined(),
    amountPerPoint: decimalField(messages)
      .min(0.01, messages.amountPerPointRange)
      .max(1000, messages.amountPerPointRange),
    redeemPoints: numberField(messages)
      .integer(messages.integer)
      .min(1, messages.redeemPointsRange)
      .max(100000, messages.redeemPointsRange),
    redeemAmount: decimalField(messages).min(0.01, messages.redeemAmountRange).max(10000, messages.redeemAmountRange),
    maxRedeemPercent: numberField(messages)
      .integer(messages.integer)
      .min(1, messages.percentRange)
      .max(100, messages.percentRange),
    minRedeemPoints: numberField(messages)
      .integer(messages.integer)
      .min(0, messages.minimumPointsRange)
      .max(100000, messages.minimumPointsRange),
    validityMonths: numberField(messages)
      .integer(messages.integer)
      .min(1, messages.validityRange)
      .max(60, messages.validityRange),
    expiryWarningDays: numberField(messages)
      .integer(messages.integer)
      .min(1, messages.warningRange)
      .max(90, messages.warningRange)
      .test('before-validity', messages.warningBeforeValidity, function (value) {
        const validityMonths = Number(this.parent.validityMonths)
        if (!Number.isFinite(value) || !Number.isFinite(validityMonths)) return true
        // Use the shortest possible calendar month as a conservative client-side guard.
        // The backend remains authoritative for the exact configured-period comparison.
        return value < validityMonths * 28
      }),
  })
}
