import * as yup from 'yup'

import type { ShippingMethodFormValues } from '@/modules/shipping-methods/types/shipping-method.types'

export type ShippingMethodValidationMessages = {
  required: string
  validNumber: string
  nonNegative: string
  integer: string
  pickupPriceZero: string
}

export function createShippingMethodSchema(mode: 'create' | 'edit', messages: ShippingMethodValidationMessages) {
  const numberField = yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? Number.NaN : value))
    .typeError(messages.validNumber)
    .required(messages.required)
    .test('finite', messages.validNumber, Number.isFinite)

  return yup.object<ShippingMethodFormValues>({
    code: yup.string().trim().required(messages.required),
    name: yup.object({
      ar: yup.string().trim().required(messages.required),
      en: yup.string().trim().required(messages.required),
    }),
    etaLabel: yup.object({
      ar: yup.string().trim().required(messages.required),
      en: yup.string().trim().required(messages.required),
    }),
    price: numberField.min(0, messages.nonNegative).test('pickup-price', messages.pickupPriceZero, function (value) {
      return !this.parent.isPickup || value === 0
    }),
    isPickup: yup.boolean().defined(),
    isActive: yup.boolean().defined(),
    sortOrder: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
      .nullable()
      .defined()
      .integer(messages.integer)
      .test('required-on-edit', messages.required, (value) => mode === 'create' || value !== null),
  })
}
