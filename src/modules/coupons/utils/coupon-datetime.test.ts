import { describe, expect, it } from 'vitest'

import { toCouponApiDateTime, toCouponDateTimeInput } from '@/modules/coupons/utils/coupon-datetime'

describe('Coupon datetime conversion', () => {
  it.each([
    ['2026-10-01T10:30', '2026-10-01 10:30:00'],
    ['2026-10-01T10:30:45', '2026-10-01 10:30:45'],
  ])('serializes %s without changing its wall-clock time', (formValue, apiValue) => {
    const result = toCouponApiDateTime(formValue)
    expect(result).toBe(apiValue)
    expect(result).not.toMatch(/[TZ]/)
    expect(result).not.toContain('.000Z')
  })

  it('serializes an empty value as null', () => {
    expect(toCouponApiDateTime('')).toBeNull()
  })

  it('rejects malformed or impossible form values', () => {
    expect(() => toCouponApiDateTime('2026-02-31T10:30')).toThrow(RangeError)
    expect(() => toCouponApiDateTime('2026-10-01 10:30:00')).toThrow(RangeError)
  })

  it.each([
    ['2026-10-01T10:30:00+00:00', '2026-10-01T10:30'],
    ['2026-10-11T10:30:00+00:00', '2026-10-11T10:30'],
  ])('maps confirmed backend response %s to the same datetime-local wall clock', (apiValue, formValue) => {
    expect(toCouponDateTimeInput(apiValue)).toBe(formValue)
  })

  it('maps null and malformed backend values to an empty form value', () => {
    expect(toCouponDateTimeInput(null)).toBe('')
    expect(toCouponDateTimeInput('2026-02-31T10:30:00+00:00')).toBe('')
    expect(toCouponDateTimeInput('not-a-timestamp')).toBe('')
  })

  it('retains defensive support for the legacy space-separated read value', () => {
    expect(toCouponDateTimeInput('2026-10-01 10:30:00')).toBe('2026-10-01T10:30')
  })

  it('preserves wall-clock time through write and simulated real-backend read formats', () => {
    const formValue = '2026-10-01T10:30'
    const writeValue = toCouponApiDateTime(formValue)
    expect(writeValue).toBe('2026-10-01 10:30:00')
    const backendResponse = `${writeValue?.replace(' ', 'T')}+00:00`
    expect(toCouponDateTimeInput(backendResponse)).toBe(formValue)
  })

  it('does not shift offset-aware backend values into the browser timezone', () => {
    expect(toCouponDateTimeInput('2026-10-01T23:45:00-08:00')).toBe('2026-10-01T23:45')
  })
})
