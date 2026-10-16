import { afterEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'

import { applyApiValidationErrors } from './apply-api-validation-errors'

describe('applyApiValidationErrors', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it.each([
    ['en', 'Review this field and try again.'],
    ['ar', 'راجع هذا الحقل وحاول مرة أخرى.'],
  ])('maps nested Laravel fields with a localized fallback in %s', async (language, expectedMessage) => {
    await i18n.changeLanguage(language)
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
    expect(setError).toHaveBeenCalledWith('boundary', { type: 'server', message: expectedMessage })
    expect(setError).toHaveBeenCalledWith('center', { type: 'server', message: expectedMessage })
  })
})
