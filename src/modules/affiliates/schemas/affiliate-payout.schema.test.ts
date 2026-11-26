import { afterEach, describe, expect, it, vi } from 'vitest'
import { payoutPaidSchema, payoutRejectSchema, payoutToday } from './affiliate-payout.schema'
afterEach(() => vi.useRealTimers())
describe('Documented payout validation', () => {
  it.each([2, 51])('rejects reference length %s', (length) => {
    expect(
      payoutPaidSchema.safeParse({ transfer_reference: 'x'.repeat(length), transferred_at: payoutToday() }).success
    ).toBe(false)
  })
  it.each([3, 50])('accepts reference length %s and preserves date-only transport', (length) => {
    expect(
      payoutPaidSchema.parse({ transfer_reference: 'x'.repeat(length), transferred_at: payoutToday() }).transferred_at
    ).toBe(payoutToday())
  })
  it.each(['2026-02-30', '2026-13-01', '2026-1-01', '2099-01-01', ''])('rejects invalid/future date %s', (date) => {
    expect(payoutPaidSchema.safeParse({ transfer_reference: 'REF', transferred_at: date }).success).toBe(false)
  })
  it('defaults to the local calendar day and accepts today but not tomorrow', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 26, 12))
    expect(payoutToday()).toBe('2026-11-26')
    expect(payoutPaidSchema.safeParse({ transfer_reference: 'REF', transferred_at: '2026-11-26' }).success).toBe(true)
    expect(payoutPaidSchema.safeParse({ transfer_reference: 'REF', transferred_at: '2026-11-27' }).success).toBe(false)
  })
  it.each([9, 251])('rejects reason length %s', (length) =>
    expect(payoutRejectSchema.safeParse({ reason: 'x'.repeat(length) }).success).toBe(false)
  )
  it.each([10, 250])('accepts reason length %s', (length) =>
    expect(payoutRejectSchema.parse({ reason: 'x'.repeat(length) }).reason).toHaveLength(length)
  )
})
