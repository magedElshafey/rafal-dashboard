import { describe, expect, it } from 'vitest'

import { createLoyaltySettingsSchema } from '@/modules/loyalty/schemas/loyalty-settings.schema'
import type { LoyaltySettingsVersion } from '@/modules/loyalty/types/loyalty.types'
import { getLoyaltyVersionChanges } from '@/modules/loyalty/utils/loyalty-history'
import { calculateLoyaltyPreview, roundEarnedLoyaltyPoints } from '@/modules/loyalty/utils/loyalty-settings'

const messages = {
  required: 'required',
  validNumber: 'number',
  integer: 'integer',
  amountPerPointRange: 'amount range',
  redeemPointsRange: 'points range',
  redeemAmountRange: 'redeem range',
  percentRange: 'percent range',
  minimumPointsRange: 'minimum range',
  validityRange: 'validity range',
  warningRange: 'warning range',
  warningBeforeValidity: 'warning before validity',
  twoDecimals: 'two decimals',
}

const validValues = {
  isEnabled: true,
  amountPerPoint: 10,
  redeemPoints: 100,
  redeemAmount: 5,
  maxRedeemPercent: 50,
  minRedeemPoints: 100,
  validityMonths: 12,
  expiryWarningDays: 30,
}

describe('loyalty settings rules', () => {
  it('calculates the documented 500 SAR nominal preview locally', () => {
    expect(calculateLoyaltyPreview(validValues)).toEqual({ points: 50, value: 2.5, returnPercent: 0.5 })
  })

  it.each([
    [33.4, 33],
    [33.5, 34],
    [33.6, 34],
    [0, 0],
    [999_999.5, 1_000_000],
  ])('rounds %s earned points to %s using standard mathematical rounding', (points, expected) => {
    expect(roundEarnedLoyaltyPoints(points)).toBe(expected)
  })

  it('uses rounded points for the preview value without changing the established return formula', () => {
    const preview = calculateLoyaltyPreview({ ...validValues, amountPerPoint: 500 / 33.5 })

    expect(preview?.points).toBe(34)
    expect(preview?.value).toBeCloseTo(1.7)
    expect(preview?.returnPercent).toBeCloseTo(0.335)
  })

  it('rejects invalid ranges, excess decimals, and a warning that cannot be shorter than validity', async () => {
    const schema = createLoyaltySettingsSchema(messages)

    await expect(schema.validate({ ...validValues, amountPerPoint: 1.234 })).rejects.toThrow('two decimals')
    await expect(schema.validate({ ...validValues, maxRedeemPercent: 101 })).rejects.toThrow('percent range')
    await expect(schema.validate({ ...validValues, validityMonths: 1, expiryWarningDays: 40 })).rejects.toThrow(
      'warning before validity'
    )
    await expect(schema.validate({ ...validValues, validityMonths: 1, expiryWarningDays: 28 })).rejects.toThrow(
      'warning before validity'
    )
    await expect(schema.validate({ ...validValues, validityMonths: 1, expiryWarningDays: 27 })).resolves.toMatchObject({
      validityMonths: 1,
      expiryWarningDays: 27,
    })
  })
})

describe('loyalty version comparisons', () => {
  const values = {
    isEnabled: true,
    amountPerPoint: '10.00',
    redeemPoints: 100,
    redeemAmount: '5.00',
    maxRedeemPercent: 50,
    minRedeemPoints: 100,
    validityMonths: 12,
    expiryWarningDays: 30,
    effectiveReturnPercent: 0.5,
  }

  it('shows every field for the initial version and no fabricated changes for identical saves', () => {
    const base: Omit<LoyaltySettingsVersion, 'previousValues'> = {
      id: 1,
      savedAt: '2026-11-13T17:23:02+03:00',
      admin: { id: 1, name: 'Admin' },
      values,
    }

    expect(getLoyaltyVersionChanges({ ...base, previousValues: null })).toHaveLength(9)
    expect(getLoyaltyVersionChanges({ ...base, previousValues: { ...values } })).toEqual([])
  })

  it('returns only actual before/after differences', () => {
    const version: LoyaltySettingsVersion = {
      id: 2,
      savedAt: '2026-11-13T17:23:02+03:00',
      admin: { id: 1, name: 'Admin' },
      values: { ...values, amountPerPoint: '11.00' },
      previousValues: values,
    }
    expect(getLoyaltyVersionChanges(version)).toEqual([{ field: 'amountPerPoint', before: '10.00', after: '11.00' }])
  })

  it('preserves number-to-null expiry changes', () => {
    const version: LoyaltySettingsVersion = {
      id: 3,
      savedAt: '2026-11-13T17:23:02+03:00',
      admin: { id: 1, name: 'Admin' },
      values: { ...values, validityMonths: null, expiryWarningDays: null },
      previousValues: values,
    }

    expect(getLoyaltyVersionChanges(version)).toEqual(
      expect.arrayContaining([
        { field: 'validityMonths', before: 12, after: null },
        { field: 'expiryWarningDays', before: 30, after: null },
      ])
    )
  })
})
