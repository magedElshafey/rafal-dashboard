import { describe, expect, it } from 'vitest'

import type { ShippingMethodFormValues } from '@/modules/shipping-methods/types/shipping-method.types'
import { createShippingMethodSchema } from './shipping-method.schema'

const messages = {
  required: 'required',
  validNumber: 'number',
  nonNegative: 'non-negative',
  integer: 'integer',
  pickupPriceZero: 'pickup-zero',
}
const createSchema = createShippingMethodSchema('create', messages)
const editSchema = createShippingMethodSchema('edit', messages)
const valid: ShippingMethodFormValues = {
  code: 'standard',
  name: { ar: 'عادي', en: 'Standard' },
  etaLabel: { ar: '٣ أيام', en: '3 days' },
  price: 25,
  isPickup: false,
  isActive: true,
  sortOrder: 0,
}

describe('Shipping Method validation', () => {
  it.each(['code', 'name.ar', 'name.en', 'etaLabel.ar', 'etaLabel.en'])('rejects blank %s', async (path) => {
    const next = structuredClone(valid) as Record<string, unknown>
    const [parent, child] = path.split('.')
    if (child) (next[parent] as Record<string, unknown>)[child] = '   '
    else next[parent] = '   '
    await expect(createSchema.isValid(next)).resolves.toBe(false)
  })

  it.each([
    [0, true],
    [25, true],
    [12.5, true],
    [-1, false],
    [Number.POSITIVE_INFINITY, false],
  ])('validates price %s', async (price, expected) => {
    await expect(createSchema.isValid({ ...valid, price })).resolves.toBe(expected)
  })

  it.each([
    [null, true],
    [0, true],
    [-3, true],
    [4, true],
    [1.5, false],
  ])('validates sort order %s', async (sortOrder, expected) => {
    await expect(createSchema.isValid({ ...valid, sortOrder })).resolves.toBe(expected)
  })

  it.each([
    [null, false],
    [0, true],
    [-2, true],
    [3, true],
    [1.5, false],
  ])('validates Edit sort order %s', async (sortOrder, expected) => {
    await expect(editSchema.isValid({ ...valid, sortOrder })).resolves.toBe(expected)
  })

  it('requires zero price for Pickup', async () => {
    await expect(createSchema.isValid({ ...valid, isPickup: true, price: 0 })).resolves.toBe(true)
    await expect(createSchema.isValid({ ...valid, isPickup: true, price: 1 })).resolves.toBe(false)
  })
})
