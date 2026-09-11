import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const requestUse = vi.fn()
  const responseUse = vi.fn()
  const axiosInstance = {
    interceptors: {
      request: { use: requestUse },
      response: { use: responseUse },
    },
  }

  return {
    applyCommonHeaders: vi.fn(),
    axiosInstance,
    clearQueryClientAtAuthBoundary: vi.fn(),
    createAxios: vi.fn(() => axiosInstance),
    getApiBasePathByRole: vi.fn(() => '/api/users/student'),
    getDefaultLoginPath: vi.fn(() => '#default-login'),
    getLoginPathByPortal: vi.fn(() => '#user-login'),
    getState: vi.fn(),
    isCancel: vi.fn(() => false),
    joinUrl: vi.fn(() => 'https://api.test/api/users/student'),
    logout: vi.fn(),
    notifyErrorResponse: vi.fn(),
    notifySuccessResponse: vi.fn(),
    requestUse,
    responseUse,
  }
})

vi.mock('axios', () => ({
  default: {
    create: mocks.createAxios,
    isCancel: mocks.isCancel,
  },
}))

vi.mock('@/components/core/portal-link/utils/url', () => ({
  joinUrl: mocks.joinUrl,
}))

vi.mock('@/config/axios.helpers', () => ({
  applyCommonHeaders: mocks.applyCommonHeaders,
  notifyErrorResponse: mocks.notifyErrorResponse,
  notifySuccessResponse: mocks.notifySuccessResponse,
}))

vi.mock('@/config/auth.helpers', () => ({
  getApiBasePathByRole: mocks.getApiBasePathByRole,
  getDefaultLoginPath: mocks.getDefaultLoginPath,
  getLoginPathByPortal: mocks.getLoginPathByPortal,
}))

vi.mock('@/lib/react-query/query-client', () => ({
  clearQueryClientAtAuthBoundary: mocks.clearQueryClientAtAuthBoundary,
}))

vi.mock('@/store/auth', () => ({
  useAuth: { getState: mocks.getState },
}))

vi.mock('./env', () => ({
  default: { API_BASE: 'https://api.test' },
}))

import './axios'

type ResponseErrorHandler = (error: {
  code?: string
  config?: { headers: { get: (name: string) => unknown } }
  response?: { status: number }
}) => Promise<never>

const responseErrorHandler = mocks.responseUse.mock.calls[0]?.[1] as ResponseErrorHandler

function createUnauthorizedError(authorization: string) {
  return {
    config: {
      headers: {
        get: (name: string) => (name === 'Authorization' ? authorization : undefined),
      },
    },
    response: { status: 401 },
  }
}

describe('axios 401 auth boundary', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
    mocks.clearQueryClientAtAuthBoundary.mockClear()
    mocks.getDefaultLoginPath.mockClear()
    mocks.getLoginPathByPortal.mockClear()
    mocks.getState.mockReset()
    mocks.isCancel.mockClear()
    mocks.logout.mockClear()
  })

  it('clears and logs out when the rejected request used the current authenticated token', async () => {
    mocks.getState.mockReturnValue({
      isAuthenticated: true,
      logout: mocks.logout,
      portal: 'user',
      token: 'current-token',
    })
    const error = createUnauthorizedError('Bearer current-token')

    await expect(responseErrorHandler(error)).rejects.toBe(error)

    expect(mocks.clearQueryClientAtAuthBoundary).toHaveBeenCalledOnce()
    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(mocks.clearQueryClientAtAuthBoundary.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.logout.mock.invocationCallOrder[0]
    )
    expect(window.location.hash).toBe('#user-login')
  })

  it('ignores a late 401 from a request that used an older token', async () => {
    mocks.getState.mockReturnValue({
      isAuthenticated: true,
      logout: mocks.logout,
      portal: 'user',
      token: 'refreshed-token',
    })
    const error = createUnauthorizedError('Bearer old-token')

    await expect(responseErrorHandler(error)).rejects.toBe(error)

    expect(mocks.clearQueryClientAtAuthBoundary).not.toHaveBeenCalled()
    expect(mocks.logout).not.toHaveBeenCalled()
    expect(mocks.getLoginPathByPortal).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('')
  })
})
