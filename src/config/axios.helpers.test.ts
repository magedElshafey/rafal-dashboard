import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosHeaders, type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

const mocks = vi.hoisted(() => ({
  fire: vi.fn(),
  getAuthState: vi.fn(),
}))

vi.mock('@/utils/observer', () => ({
  observer: { fire: mocks.fire },
}))
vi.mock('react-i18next', () => ({ getI18n: () => ({ language: 'en' }) }))
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

  it('preserves existing success notifications for other requests', () => {
    notifySuccessResponse(createResponse())

    expect(mocks.fire).toHaveBeenCalledWith('notify', {
      type: 'success',
      message: 'Device token saved successfully.',
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
})
