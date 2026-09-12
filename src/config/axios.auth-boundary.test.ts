import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const requestUse = vi.fn()
  const responseUse = vi.fn()
  return {
    requestUse,
    responseUse,
    createAxios: vi.fn(() => ({
      interceptors: { request: { use: requestUse }, response: { use: responseUse } },
    })),
    isCancel: vi.fn(() => false),
    clearQueryClientAtAuthBoundary: vi.fn(),
    getState: vi.fn(),
    logout: vi.fn(),
    notifyErrorResponse: vi.fn(),
  }
})

vi.mock('axios', () => ({
  default: { create: mocks.createAxios, isCancel: mocks.isCancel },
}))
vi.mock('@/config/axios.helpers', () => ({
  applyCommonHeaders: vi.fn(),
  notifyErrorResponse: mocks.notifyErrorResponse,
  notifySuccessResponse: vi.fn(),
}))
vi.mock('@/lib/react-query/query-client', () => ({
  clearQueryClientAtAuthBoundary: mocks.clearQueryClientAtAuthBoundary,
}))
vi.mock('@/store/auth', () => ({ useAuth: { getState: mocks.getState } }))
vi.mock('./env', () => ({ default: { API_BASE: 'https://api.test' } }))

import './axios'

type ResponseErrorHandler = (error: {
  code?: string
  config?: { headers: { get: (name: string) => unknown }; suppressForbiddenRedirect?: boolean }
  response?: { status: number }
}) => Promise<never>

const responseErrorHandler = mocks.responseUse.mock.calls[0]?.[1] as ResponseErrorHandler

describe('shared axios auth boundary', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
    mocks.clearQueryClientAtAuthBoundary.mockClear()
    mocks.getState.mockReset()
    mocks.logout.mockClear()
    mocks.isCancel.mockClear()
    mocks.notifyErrorResponse.mockClear()
  })

  it('uses the single neutral API base URL', () => {
    expect(mocks.createAxios).toHaveBeenCalledTimes(1)
    expect(mocks.createAxios).toHaveBeenCalledWith({ baseURL: 'https://api.test' })
  })

  it('clears the authenticated session and redirects to /login on a current-token 401', async () => {
    mocks.getState.mockReturnValue({
      isAuthenticated: true,
      logout: mocks.logout,
      token: 'current-token',
    })
    const error = {
      config: { headers: { get: () => 'Bearer current-token' } },
      response: { status: 401 },
    }

    await expect(responseErrorHandler(error)).rejects.toBe(error)

    expect(mocks.clearQueryClientAtAuthBoundary).toHaveBeenCalledOnce()
    expect(mocks.logout).toHaveBeenCalledOnce()
  })

  it('allows a feature to own a documented domain 403 without a global redirect', async () => {
    const error = {
      config: { headers: { get: () => undefined }, suppressForbiddenRedirect: true },
      response: { status: 403 },
    }

    await expect(responseErrorHandler(error)).rejects.toBe(error)

    expect(mocks.notifyErrorResponse).toHaveBeenCalledWith(error)
    expect(window.location.pathname).toBe('/')
  })
})
