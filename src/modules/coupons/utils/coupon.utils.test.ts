import { describe, expect, it } from 'vitest'

import type { Coupon, CouponFormValues } from '@/modules/coupons/types/coupon.types'
import {
  buildCouponCreatePayload,
  buildCouponUpdatePayload,
  toCouponFormValues,
} from '@/modules/coupons/utils/coupon.utils'

const values: CouponFormValues = {
  code: ' WELCOME ',
  name: { ar: ' ترحيب ', en: ' Welcome ' },
  description: { ar: ' وصف ', en: '' },
  type: 'percent',
  value: 10,
  maxDiscountAmount: 150,
  minOrderAmount: 25,
  startsAt: '',
  endsAt: '',
  isPublic: true,
  isActive: true,
  usageLimitTotal: 100,
  usageLimitPerCustomer: 1,
  newCustomersOnly: false,
}

const fixedCoupon: Coupon = {
  id: 1,
  code: 'WELCOME',
  name: { ar: 'ترحيب', en: 'Welcome' },
  description: { ar: null, en: null },
  type: 'fixed',
  value: 5,
  maxDiscountAmount: null,
  minOrderAmount: null,
  startsAt: null,
  endsAt: null,
  isPublic: false,
  isActive: true,
  usageLimitTotal: null,
  usageLimitPerCustomer: null,
  newCustomersOnly: false,
  usagesCount: 7,
  createdAt: '2026-09-28T00:00:00Z',
  updatedAt: '2026-09-28T00:00:00Z',
}

describe('Coupon utilities', () => {
  it('builds Create values with nullable text and dates', () => {
    expect(buildCouponCreatePayload(values)).toMatchObject({
      code: 'WELCOME',
      name: { ar: 'ترحيب', en: 'Welcome' },
      description: { ar: 'وصف', en: null },
      startsAt: null,
      endsAt: null,
    })
  })

  it('builds a full Update from current form state when only the code changed', () => {
    const result = buildCouponUpdatePayload({
      ...values,
      code: ' UPDATED ',
      value: 0,
      minOrderAmount: null,
      startsAt: '2026-10-01T10:30',
      endsAt: '2026-10-01T12:45:30',
      isPublic: false,
      isActive: false,
      usageLimitTotal: 0,
      usageLimitPerCustomer: null,
    })

    expect(result).toEqual({
      code: 'UPDATED',
      name: { ar: 'ترحيب', en: 'Welcome' },
      description: { ar: 'وصف', en: null },
      type: 'percent',
      value: 0,
      maxDiscountAmount: 150,
      minOrderAmount: null,
      startsAt: '2026-10-01 10:30:00',
      endsAt: '2026-10-01 12:45:30',
      isPublic: false,
      isActive: false,
      usageLimitTotal: 0,
      usageLimitPerCustomer: null,
      newCustomersOnly: false,
    })
    expect(result).not.toHaveProperty('usagesCount')
    expect(result).not.toHaveProperty('createdAt')
    expect(result).not.toHaveProperty('updatedAt')
  })

  it('sends the full body with a canonical null max discount when changing percent to fixed', () => {
    const result = buildCouponUpdatePayload({ ...values, type: 'fixed', maxDiscountAmount: 150 })
    expect(result).toMatchObject({
      code: 'WELCOME',
      name: { ar: 'ترحيب', en: 'Welcome' },
      type: 'fixed',
      value: 10,
      maxDiscountAmount: null,
      usageLimitPerCustomer: 1,
    })
  })

  it('sends the full body with the current max discount when changing fixed to percent', () => {
    const result = buildCouponUpdatePayload({
      ...toCouponFormValues(fixedCoupon),
      type: 'percent',
      maxDiscountAmount: 75,
    })
    expect(result).toEqual({
      code: 'WELCOME',
      name: { ar: 'ترحيب', en: 'Welcome' },
      description: { ar: null, en: null },
      type: 'percent',
      value: 5,
      maxDiscountAmount: 75,
      minOrderAmount: null,
      startsAt: null,
      endsAt: null,
      isPublic: false,
      isActive: true,
      usageLimitTotal: null,
      usageLimitPerCustomer: null,
      newCustomersOnly: false,
    })
  })

  it('maps nullable API values into stable row-backed form defaults', () => {
    expect(toCouponFormValues(fixedCoupon)).toMatchObject({
      description: { ar: '', en: '' },
      startsAt: '',
      endsAt: '',
      maxDiscountAmount: null,
    })
  })
})
