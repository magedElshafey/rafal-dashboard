import { describe, expect, it } from 'vitest'

import { createAffiliateSettingsSchema } from '@/modules/affiliates/schemas/affiliate-settings.schema'

const schema = createAffiliateSettingsSchema({
  required: 'required',
  validNumber: 'number',
  percentageRange: 'percentage',
  payoutFormat: 'payout-format',
  payoutPositive: 'payout-positive',
  termsSlug: 'slug',
})

const valid = {
  programEnabled: true,
  applicationsEnabled: false,
  customerDiscountPercentage: 0,
  affiliateCommissionPercentage: 100,
  minimumPayoutAmount: '100.00',
  termsPageReference: 'affiliate-program-terms',
}

describe('Affiliate settings validation', () => {
  it('accepts percentage boundaries and decimal percentages', async () => {
    await expect(schema.validate(valid)).resolves.toMatchObject(valid)
    await expect(schema.validate({ ...valid, customerDiscountPercentage: 12.345 })).resolves.toMatchObject({
      customerDiscountPercentage: 12.345,
    })
  })

  it.each([-0.01, 100.01])('rejects out-of-range percentages: %s', async (value) => {
    await expect(schema.validate({ ...valid, customerDiscountPercentage: value })).rejects.toThrow('percentage')
  })

  it.each(['0', '0.0', '-1', '01', '1.', '.5', 'abc'])('rejects invalid or non-positive payout: %s', async (value) => {
    await expect(schema.validate({ ...valid, minimumPayoutAmount: value })).rejects.toThrow()
  })

  it.each(['Affiliate-Terms', 'affiliate_terms', 'affiliate--terms', '/affiliate-terms', 'affiliate-terms/'])(
    'rejects an invalid terms slug: %s',
    async (value) => {
      await expect(schema.validate({ ...valid, termsPageReference: value })).rejects.toThrow('slug')
    }
  )
})
