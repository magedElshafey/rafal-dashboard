import * as yup from 'yup'
import type { AffiliateSettingsFormValues } from '../types/affiliate.types'
export type AffiliateSettingsValidationMessages = {
  required: string
  validNumber: string
  percentageRange: string
  payoutFormat: string
  payoutPositive: string
  termsSlug: string
}
function percentage(min: number, messages: AffiliateSettingsValidationMessages) {
  return yup
    .number()
    .typeError(messages.validNumber)
    .required(messages.required)
    .min(min, messages.percentageRange)
    .max(50, messages.percentageRange)
    .test(
      'precision',
      messages.percentageRange,
      (value) => value !== undefined && Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8
    )
}
export function createAffiliateSettingsSchema(
  messages: AffiliateSettingsValidationMessages
): yup.ObjectSchema<AffiliateSettingsFormValues> {
  return yup.object({
    programEnabled: yup.boolean().required(),
    applicationsEnabled: yup.boolean().required(),
    customerDiscountPercentage: percentage(1, messages),
    affiliateCommissionPercentage: percentage(0.5, messages),
    minimumPayoutAmount: yup
      .string()
      .trim()
      .required(messages.required)
      .matches(/^\d+(?:\.\d+)?$/, messages.payoutFormat)
      .test('range', messages.payoutPositive, (v) => v !== undefined && Number(v) >= 0 && Number(v) <= 10000),
    termsPageId: yup
      .number()
      .nullable()
      .defined()
      .test('page', messages.termsSlug, (v) => v !== null && Number.isSafeInteger(v) && v > 0),
  })
}
