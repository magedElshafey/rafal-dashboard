import * as yup from 'yup'

import type { CouponFormValues } from '@/modules/coupons/types/coupon.types'
import { isCouponDateRangeOrdered } from '@/modules/coupons/utils/coupon-datetime'
import { isValidDateInput } from '@/utils/date/date.helpers'

export type CouponValidationMessages = {
  required: string
  validNumber: string
  percentRange: string
  validDate: string
  dateOrder: string
}

export function createCouponSchema(messages: CouponValidationMessages) {
  const nullableNumber = yup
    .number()
    .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
    .nullable()
    .defined()
    .typeError(messages.validNumber)
    .test('finite', messages.validNumber, (value) => value === null || Number.isFinite(value))

  return yup.object<CouponFormValues>({
    code: yup.string().trim().required(messages.required),
    name: yup.object({
      ar: yup.string().trim().required(messages.required),
      en: yup.string().trim().required(messages.required),
    }),
    description: yup.object({ ar: yup.string().defined(), en: yup.string().defined() }),
    type: yup.mixed<'percent' | 'fixed'>().oneOf(['percent', 'fixed']).required(messages.required),
    value: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' ? Number.NaN : value))
      .typeError(messages.validNumber)
      .required(messages.required)
      .test('finite', messages.validNumber, Number.isFinite)
      .test('percent-range', messages.percentRange, function (value) {
        return this.parent.type !== 'percent' || (value >= 0 && value <= 100)
      }),
    maxDiscountAmount: nullableNumber,
    minOrderAmount: nullableNumber,
    startsAt: yup
      .string()
      .defined()
      .test('valid-date', messages.validDate, (value) => !value || isValidDateInput(value)),
    endsAt: yup
      .string()
      .defined()
      .test('valid-date', messages.validDate, (value) => !value || isValidDateInput(value))
      .test('date-order', messages.dateOrder, function (value) {
        return isCouponDateRangeOrdered(this.parent.startsAt, value)
      }),
    isPublic: yup.boolean().defined(),
    isActive: yup.boolean().defined(),
    usageLimitTotal: nullableNumber,
    usageLimitPerCustomer: nullableNumber,
    newCustomersOnly: yup.boolean().defined(),
  })
}
