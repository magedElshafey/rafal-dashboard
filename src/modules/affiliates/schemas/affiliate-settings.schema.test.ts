import { describe, expect, it } from 'vitest'
import { createAffiliateSettingsSchema } from './affiliate-settings.schema'
const schema = createAffiliateSettingsSchema({
  required: 'required',
  validNumber: 'number',
  percentageRange: 'percentage',
  payoutFormat: 'payout',
  payoutPositive: 'range',
  termsSlug: 'page',
})
const valid = {
  programEnabled: true,
  applicationsEnabled: false,
  customerDiscountPercentage: 1,
  affiliateCommissionPercentage: 0.5,
  minimumPayoutAmount: '0',
  termsPageId: 2,
}
describe('Laravel settings validation', () => {
  it('accepts zero payout and documented percentage boundaries', async () => {
    expect(await schema.isValid(valid)).toBe(true)
    expect(
      await schema.isValid({
        ...valid,
        customerDiscountPercentage: 50,
        affiliateCommissionPercentage: 50,
        minimumPayoutAmount: '10000',
      })
    ).toBe(true)
  })
  it.each([0, 50.01, 12.345, NaN, Infinity])('rejects discount %s', async (value) =>
    expect(await schema.isValid({ ...valid, customerDiscountPercentage: value })).toBe(false)
  )
  it.each([0.49, 50.01, 1.001])('rejects commission %s', async (value) =>
    expect(await schema.isValid({ ...valid, affiliateCommissionPercentage: value })).toBe(false)
  )
  it.each(['-1', '10000.01', 'abc', ''])('rejects payout %s', async (value) =>
    expect(await schema.isValid({ ...valid, minimumPayoutAmount: value })).toBe(false)
  )
  it('preserves an explicit null page', async () => {
    expect((await schema.validate({ ...valid, termsPageId: null })).termsPageId).toBeNull()
  })
  it.each([undefined, 0, -1, 1.2])('rejects unavailable/invalid page %s', async (value) =>
    expect(await schema.isValid({ ...valid, termsPageId: value })).toBe(false)
  )
})
