import { describe, expect, it } from 'vitest'

import { createCouponSchema } from '@/modules/coupons/schemas/coupon.schema'
import type { CouponFormValues } from '@/modules/coupons/types/coupon.types'

const schema = createCouponSchema({
  required: 'required',
  validNumber: 'number',
  percentRange: 'percent-range',
  validDate: 'date',
  dateOrder: 'date-order',
})
const valid: CouponFormValues = {
  code: 'WELCOME',
  name: { ar: 'ترحيب', en: 'Welcome' },
  description: { ar: '', en: '' },
  type: 'percent',
  value: 10,
  maxDiscountAmount: null,
  minOrderAmount: null,
  startsAt: '',
  endsAt: '',
  isPublic: true,
  isActive: true,
  usageLimitTotal: null,
  usageLimitPerCustomer: null,
  newCustomersOnly: false,
}

describe('Coupon validation', () => {
  it.each(['name.ar', 'name.en'])('requires %s', async (path) => {
    const next = structuredClone(valid)
    const [, language] = path.split('.')
    next.name[language as 'ar' | 'en'] = '   '
    await expect(schema.isValid(next)).resolves.toBe(false)
  })

  it.each([
    [0, true],
    [100, true],
    [-0.1, false],
    [100.1, false],
  ])('validates percent value %s', async (value, expected) => {
    await expect(schema.isValid({ ...valid, value })).resolves.toBe(expected)
  })

  it('does not invent a range for fixed values', async () => {
    await expect(schema.isValid({ ...valid, type: 'fixed', value: -10 })).resolves.toBe(true)
  })

  it.each([
    ['', '', true],
    ['2026-09-28T10:00', '', true],
    ['', '2026-09-28T10:00', true],
    ['2026-09-28T10:00', '2026-09-28T10:00', true],
    ['2026-09-28T10:00', '2026-09-28T11:00', true],
    ['2026-09-28T11:00', '2026-09-28T10:00', false],
  ])('validates independent date range %s to %s', async (startsAt, endsAt, expected) => {
    await expect(schema.isValid({ ...valid, startsAt, endsAt })).resolves.toBe(expected)
  })
})
