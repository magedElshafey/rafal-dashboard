import { describe, expect, it } from 'vitest'

import { getLoyaltyLedgerDateState, readLoyaltyLedgerFilters, serializeLoyaltyLedgerFilters } from './loyalty-ledger'

describe('loyalty ledger filters', () => {
  it('accepts only the documented type and complete valid date ranges', () => {
    expect(readLoyaltyLedgerFilters({ type: 'unknown', from: '2026-11-01', to: '2026-11-30' })).toEqual({
      type: null,
      from: '2026-11-01',
      to: '2026-11-30',
    })
    expect(getLoyaltyLedgerDateState({ type: null, from: '2026-11-01', to: '' })).toBe('incomplete')
    expect(getLoyaltyLedgerDateState({ type: null, from: '2026-12-01', to: '2026-11-30' })).toBe('invalid')
    expect(getLoyaltyLedgerDateState({ type: null, from: '2026-11-01', to: '2026-11-30' })).toBe('valid')
  })

  it('never serializes incomplete date ranges or unsupported values', () => {
    expect(serializeLoyaltyLedgerFilters({ type: null, from: '2026-11-01', to: '' })).toEqual({})
    expect(serializeLoyaltyLedgerFilters({ type: 'adjust_credit', from: '2026-11-01', to: '2026-11-30' })).toEqual({
      type: 'adjust_credit',
      from: '2026-11-01',
      to: '2026-11-30',
    })
  })
})
