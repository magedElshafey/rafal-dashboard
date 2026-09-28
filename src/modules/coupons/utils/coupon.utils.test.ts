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

  it('maps only granular dirty fields and explicitly cleared nullable values', () => {
    expect(
      buildCouponUpdatePayload(
        { ...values, description: { ...values.description, en: '' }, minOrderAmount: null, endsAt: '' },
        { name: { en: true }, description: { en: true }, minOrderAmount: true, endsAt: true }
      )
    ).toEqual({ name: { en: 'Welcome' }, description: { en: null }, minOrderAmount: null, endsAt: null })
  })

  it('serializes only dirty scheduling fields in the backend wall-clock format', () => {
    expect(
      buildCouponUpdatePayload(
        { ...values, startsAt: '2026-10-01T10:30', endsAt: '2026-10-01T12:45:30' },
        { startsAt: true, endsAt: true }
      )
    ).toEqual({ startsAt: '2026-10-01 10:30:00', endsAt: '2026-10-01 12:45:30' })
  })

  it.each(['startsAt', 'endsAt'] as const)('sends null when dirty %s is cleared', (field) => {
    expect(buildCouponUpdatePayload({ ...values, [field]: '' }, { [field]: true })).toEqual({ [field]: null })
  })

  it('omits unmodified scheduling fields from partial Update', () => {
    expect(
      buildCouponUpdatePayload({ ...values, startsAt: '2026-10-01T10:30', endsAt: '2026-10-01T12:30' }, { code: true })
    ).toEqual({ code: 'WELCOME' })
  })

  it('includes changed booleans while never exposing read-only or timestamp fields', () => {
    const result = buildCouponUpdatePayload({ ...values, isActive: false }, { isActive: true })
    expect(result).toEqual({ isActive: false })
    expect(result).not.toHaveProperty('usagesCount')
    expect(result).not.toHaveProperty('createdAt')
    expect(result).not.toHaveProperty('updatedAt')
  })

  it('treats max discount as non-applicable for fixed Coupons', () => {
    const result = buildCouponUpdatePayload(
      { ...values, type: 'fixed', maxDiscountAmount: null },
      { type: true, maxDiscountAmount: true }
    )
    expect(result).toEqual({ type: 'fixed' })
  })

  it('sends only type when changing fixed to percent without editing max discount', () => {
    const result = buildCouponUpdatePayload({ ...toCouponFormValues(fixedCoupon), type: 'percent' }, { type: true })
    expect(result).toEqual({ type: 'percent' })
  })

  it('includes an explicitly edited max discount when changing fixed to percent', () => {
    const result = buildCouponUpdatePayload(
      { ...values, type: 'percent', maxDiscountAmount: 150 },
      { type: true, maxDiscountAmount: true }
    )
    expect(result).toEqual({ type: 'percent', maxDiscountAmount: 150 })
  })

  it('omits max discount when editing an unrelated field on an existing percent Coupon', () => {
    const result = buildCouponUpdatePayload(values, { code: true })
    expect(result).toEqual({ code: 'WELCOME' })
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
