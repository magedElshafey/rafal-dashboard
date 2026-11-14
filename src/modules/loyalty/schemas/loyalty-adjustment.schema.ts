import * as yup from 'yup'

import type { LoyaltyAdjustmentFormValues } from '@/modules/loyalty/types/loyalty.types'

export type LoyaltyAdjustmentValidationMessages = {
  required: string
  integer: string
  pointsRange: string
  noteLength: string
  insufficientBalance: string
}

export function createLoyaltyAdjustmentSchema(
  messages: LoyaltyAdjustmentValidationMessages,
  availablePoints: number | null
) {
  return yup.object<LoyaltyAdjustmentFormValues>({
    type: yup.mixed<'credit' | 'debit'>().oneOf(['credit', 'debit'], messages.required).required(messages.required),
    points: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' || originalValue === null ? Number.NaN : value))
      .typeError(messages.required)
      .required(messages.required)
      .integer(messages.integer)
      .min(1, messages.pointsRange)
      .max(100000, messages.pointsRange)
      .test('available-balance', messages.insufficientBalance, function (value) {
        return this.parent.type !== 'debit' || availablePoints === null || value <= availablePoints
      }),
    reason: yup
      .mixed<'customer_service' | 'other'>()
      .oneOf(['customer_service', 'other'], messages.required)
      .required(messages.required),
    note: yup
      .string()
      .required(messages.required)
      .test('note-length', messages.noteLength, (value) => {
        const length = value?.trim().length ?? 0
        return length >= 10 && length <= 250
      }),
    notifyCustomer: yup.boolean().required(messages.required).defined(),
  })
}
