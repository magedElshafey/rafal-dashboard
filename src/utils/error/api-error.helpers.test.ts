import { describe, expect, it } from 'vitest'

import { getApiErrorMessage } from './api-error.helpers'

describe('getApiErrorMessage', () => {
  it('does not expose backend prose when it may use a different language', () => {
    expect(
      getApiErrorMessage(
        { isAxiosError: true, response: { data: { message: '  Backend rejected the submission.  ' } } },
        'Fallback'
      )
    ).toBe('Fallback')
  })

  it('does not read a message from an unexpected nested shape', () => {
    expect(
      getApiErrorMessage(
        { isAxiosError: true, response: { data: { data: { message: 'Nested backend message.' } } } },
        'Fallback'
      )
    ).toBe('Fallback')
  })

  it.each([
    undefined,
    { message: '' },
    { message: '   ' },
    { message: { text: 'unsafe' } },
    { error: 'Internal implementation detail' },
    ['unexpected'],
  ])('uses the fallback for missing or unusable message data', (data) => {
    expect(getApiErrorMessage({ isAxiosError: true, response: { data } }, 'Fallback')).toBe('Fallback')
  })

  it('does not expose a normal Error message', () => {
    expect(getApiErrorMessage(new Error('Sensitive client detail'), 'Fallback')).toBe('Fallback')
  })
})
