import { describe, expect, it } from 'vitest'

import { createLoyaltyAdjustmentSchema } from './loyalty-adjustment.schema'

const schema = (available: number | null = 100) =>
  createLoyaltyAdjustmentSchema(
    {
      required: 'required',
      integer: 'integer',
      pointsRange: 'range',
      noteLength: 'note',
      insufficientBalance: 'insufficient',
    },
    available
  )

const valid = {
  type: 'credit',
  points: 10,
  reason: 'customer_service',
  note: 'A valid internal note',
  notifyCustomer: false,
}

describe('loyalty adjustment validation', () => {
  it('accepts documented credit and debit values without changing the note', async () => {
    await expect(schema().validate(valid)).resolves.toEqual(valid)
    await expect(schema().validate({ ...valid, type: 'debit', points: 100, reason: 'other' })).resolves.toMatchObject({
      type: 'debit',
      points: 100,
      reason: 'other',
    })
  })

  it.each([0, -1, 1.5, 100001])('rejects invalid points %s', async (points) => {
    await expect(schema().validate({ ...valid, points })).rejects.toThrow()
  })

  it('rejects unsupported reasons and notes outside 10-250 trimmed characters', async () => {
    await expect(schema().validate({ ...valid, reason: 'refund' })).rejects.toThrow('required')
    await expect(schema().validate({ ...valid, note: ' short ' })).rejects.toThrow('note')
    await expect(schema().validate({ ...valid, note: 'x'.repeat(251) })).rejects.toThrow('note')
  })

  it('blocks a known over-balance debit but leaves unknown balance authority to the backend', async () => {
    await expect(schema(100).validate({ ...valid, type: 'debit', points: 101 })).rejects.toThrow('insufficient')
    await expect(schema(null).validate({ ...valid, type: 'debit', points: 101 })).resolves.toMatchObject({
      points: 101,
    })
  })
})
