import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosHeaders, type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

const mocks = vi.hoisted(() => ({
  fire: vi.fn(),
  getAuthState: vi.fn(),
  language: 'en',
}))

vi.mock('@/utils/observer', () => ({
  observer: { fire: mocks.fire },
}))
vi.mock('react-i18next', () => ({
  getI18n: () => ({
    language: mocks.language,
    t: (key: string) =>
      ({
        'apiFeedback.success': mocks.language === 'ar' ? 'تم إكمال العملية بنجاح.' : 'Operation completed successfully.',
        'apiFeedback.networkError': 'Unable to connect to the server. Check your connection and try again.',
        'apiFeedback.forbidden': "You don't have permission to perform this action.",
        'apiFeedback.conflict': 'The request conflicts with existing information. Review your changes and try again.',
        'apiFeedback.validationError': 'Review the highlighted fields and try again.',
        'apiFeedback.error': "The request couldn't be completed. Please try again.",
      })[key] ?? key,
  }),
}))
vi.mock('@/store/auth', () => ({ useAuth: { getState: mocks.getAuthState } }))

import { applyCommonHeaders, notifyErrorResponse, notifySuccessResponse } from './axios.helpers'

function createResponse(suppressSuccessNotification = false): AxiosResponse {
  return {
    data: { data: 'Device token saved successfully.' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: {} as AxiosResponse['config']['headers'],
      suppressSuccessNotification,
    },
  }
}

beforeEach(() => {
  mocks.fire.mockReset()
  mocks.getAuthState.mockReset()
  mocks.language = 'en'
})

describe('applyCommonHeaders', () => {
  it('adds the current session Bearer token', () => {
    mocks.getAuthState.mockReturnValue({ token: 'auth-token' })
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

    applyCommonHeaders(config)

    expect(config.headers.get('Authorization')).toBe('Bearer auth-token')
  })

  it('does not add Authorization without a session token', () => {
    mocks.getAuthState.mockReturnValue({ token: null })
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig

    applyCommonHeaders(config)

    expect(config.headers.has('Authorization')).toBe(false)
  })
})

describe('notifySuccessResponse', () => {
  it('does not surface a success message for an explicitly silent request', () => {
    const response = createResponse(true)

    expect(notifySuccessResponse(response)).toBe(response)
    expect(mocks.fire).not.toHaveBeenCalled()
  })

  it('localizes automatic success notifications instead of exposing backend prose', () => {
    notifySuccessResponse(createResponse())

    expect(mocks.fire).toHaveBeenCalledWith('notify', {
      type: 'success',
      message: 'Operation completed successfully.',
    })
  })

  it('resolves the active language when the notification is displayed', () => {
    mocks.language = 'ar'

    notifySuccessResponse(createResponse())

    expect(mocks.fire).toHaveBeenCalledWith('notify', {
      type: 'success',
      message: 'تم إكمال العملية بنجاح.',
    })
  })
})

describe('notifyErrorResponse', () => {
  it('does not surface a backend error for an explicitly silent request', () => {
    notifyErrorResponse({
      config: {
        headers: {},
        suppressErrorNotification: true,
      } as InternalAxiosRequestConfig,
      response: { data: { message: 'Raw backend error' } },
    } as AxiosError)

    expect(mocks.fire).not.toHaveBeenCalled()
  })

  it.each([
    [undefined, 'Unable to connect to the server. Check your connection and try again.'],
    [403, "You don't have permission to perform this action."],
    [409, 'The request conflicts with existing information. Review your changes and try again.'],
    [422, 'Review the highlighted fields and try again.'],
    [500, "The request couldn't be completed. Please try again."],
  ])('uses a localized semantic fallback for status %s', (status, message) => {
    notifyErrorResponse({
      config: { headers: {} } as InternalAxiosRequestConfig,
      response: status ? ({ status, data: { message: 'Raw backend error' } } as AxiosResponse) : undefined,
    } as AxiosError)

    expect(mocks.fire).toHaveBeenCalledWith('notify', { type: 'error', message })
  })
})
