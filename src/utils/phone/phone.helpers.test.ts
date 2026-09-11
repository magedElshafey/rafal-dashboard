import { describe, expect, it } from 'vitest'

import { GENERIC_PHONE_PATTERN, normalizePhoneForApi } from './phone.helpers'

describe('normalizePhoneForApi', () => {
  it.each([
    ['01022153359', '1022153359'],
    ['001022153359', '1022153359'],
    ['1022153359', '1022153359'],
    [' 01022153359 ', '1022153359'],
    ['0', ''],
    ['', ''],
  ])('normalizes %j to %j without numeric conversion', (phone, expected) => {
    expect(normalizePhoneForApi(phone)).toBe(expected)
  })
})

describe('GENERIC_PHONE_PATTERN', () => {
  it.each(['123456', '1012345678', '12345678901234567890'])('accepts generic local phone digits %s', (phone) => {
    expect(GENERIC_PHONE_PATTERN.test(phone)).toBe(true)
  })

  it.each(['12345', '123456789012345678901', '+201012345678', 'phone'])('rejects invalid phone input %s', (phone) => {
    expect(GENERIC_PHONE_PATTERN.test(phone)).toBe(false)
  })
})
