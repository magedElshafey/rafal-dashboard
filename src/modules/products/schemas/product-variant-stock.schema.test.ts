import { describe, expect, it } from 'vitest'

import { createProductVariantStockSchema } from '@/modules/products/schemas/product-variant-stock.schema'

const schema = createProductVariantStockSchema({
  required: 'required',
  validNumber: 'number',
  integer: 'integer',
  nonNegative: 'nonnegative',
})

describe('Product Variant stock validation', () => {
  it('accepts zero and positive integer quantities', async () => {
    await expect(schema.validate({ warehouseId: 1, quantity: 0 })).resolves.toBeDefined()
    await expect(schema.validate({ warehouseId: 1, quantity: 12 })).resolves.toBeDefined()
  })

  it.each([
    [{ warehouseId: null, quantity: 1 }, 'required'],
    [{ warehouseId: 1, quantity: null }, 'required'],
    [{ warehouseId: 1, quantity: -1 }, 'nonnegative'],
    [{ warehouseId: 1, quantity: 1.5 }, 'integer'],
    [{ warehouseId: 1, quantity: Number.NaN }, 'number'],
    [{ warehouseId: 1, quantity: Number.POSITIVE_INFINITY }, 'number'],
  ])('rejects invalid stock values', async (value, message) => {
    await expect(schema.validate(value)).rejects.toThrow(message)
  })
})
