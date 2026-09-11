import { describe, expect, it } from 'vitest'

import { getApiErrorMessage } from './api-error.helpers'

describe('getApiErrorMessage', () => {
  it('prioritizes a usable backend message', () => {
    expect(
      getApiErrorMessage(
        { isAxiosError: true, response: { data: { message: '  Backend rejected the submission.  ' } } },
        'Fallback'
      )
    ).toBe('Backend rejected the submission.')
  })

  it('reads a message from the API data envelope', () => {
    expect(
      getApiErrorMessage(
        { isAxiosError: true, response: { data: { data: { message: 'Nested backend message.' } } } },
        'Fallback'
      )
    ).toBe('Nested backend message.')
  })

  it.each([{ message: '' }, { message: { text: 'unsafe' } }, { error: [] }, undefined])(
    'uses the fallback for missing or unusable message data',
    (data) => {
      expect(getApiErrorMessage({ isAxiosError: true, response: { data } }, 'Fallback')).toBe('Fallback')
    }
  )
})
