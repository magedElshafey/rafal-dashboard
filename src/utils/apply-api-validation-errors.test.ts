import { describe, expect, it, vi } from 'vitest'

import { applyApiValidationErrors } from './apply-api-validation-errors'

describe('applyApiValidationErrors', () => {
  it('maps indexed Laravel geometry fields through wildcard aliases', () => {
    const setError = vi.fn()
    const applied = applyApiValidationErrors(
      {
        isAxiosError: true,
        response: {
          data: {
            errors: {
              'boundary[2][lat]': ['Invalid boundary latitude'],
              'center.lng': ['Invalid center longitude'],
            },
          },
        },
      },
      setError,
      { 'boundary.*.lat': 'boundary', 'center.lng': 'center' }
    )

    expect(applied).toBe(true)
    expect(setError).toHaveBeenCalledWith('boundary', { type: 'server', message: 'Invalid boundary latitude' })
    expect(setError).toHaveBeenCalledWith('center', { type: 'server', message: 'Invalid center longitude' })
  })
})
