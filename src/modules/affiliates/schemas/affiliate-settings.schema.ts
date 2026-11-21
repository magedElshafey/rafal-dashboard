import * as yup from 'yup'

import type { AffiliateSettingsFormValues } from '@/modules/affiliates/types/affiliate.types'

export type AffiliateSettingsValidationMessages = {
  required: string
  validNumber: string
  percentageRange: string
  payoutFormat: string
  payoutPositive: string
  termsSlug: string
}

function percentage(messages: AffiliateSettingsValidationMessages) {
  return yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? Number.NaN : value))
    .typeError(messages.validNumber)
    .required(messages.required)
    .test('finite', messages.validNumber, Number.isFinite)
    .min(0, messages.percentageRange)
    .max(100, messages.percentageRange)
}

export function createAffiliateSettingsSchema(
  messages: AffiliateSettingsValidationMessages
): yup.ObjectSchema<AffiliateSettingsFormValues> {
  return yup.object({
    programEnabled: yup.boolean().required(messages.required).defined(),
    applicationsEnabled: yup.boolean().required(messages.required).defined(),
    customerDiscountPercentage: percentage(messages),
    affiliateCommissionPercentage: percentage(messages),
    minimumPayoutAmount: yup
      .string()
      .trim()
      .required(messages.required)
      .matches(/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/, messages.payoutFormat)
      .test('positive-decimal', messages.payoutPositive, (value) => Boolean(value && !/^0(?:\.0+)?$/.test(value))),
    termsPageReference: yup
      .string()
      .trim()
      .required(messages.required)
      .max(200, messages.termsSlug)
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, messages.termsSlug),
  })
}
