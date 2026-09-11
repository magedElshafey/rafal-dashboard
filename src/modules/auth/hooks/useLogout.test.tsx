import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLogout } from './useLogout'

const mocks = vi.hoisted(() => ({
  clearQueryClientAtAuthBoundary: vi.fn(),
  logout: vi.fn(),
  navigate: vi.fn(),
  getState: vi.fn(),
  getDefaultLoginPath: vi.fn(() => '/user/login'),
  getLoginPathByPortal: vi.fn(() => '/user/login'),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}))

vi.mock('@/config/auth.helpers', () => ({
  getDefaultLoginPath: mocks.getDefaultLoginPath,
  getLoginPathByPortal: mocks.getLoginPathByPortal,
}))

vi.mock('@/lib/react-query/query-client', () => ({
  clearQueryClientAtAuthBoundary: mocks.clearQueryClientAtAuthBoundary,
}))

vi.mock('@/store/auth', () => ({
  useAuth: { getState: mocks.getState },
}))

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getState.mockReturnValue({ portal: 'user', logout: mocks.logout })
  })

  it('clears private queries and auth before replacing the portal login route', () => {
    const { result } = renderHook(() => useLogout())

    result.current()

    expect(mocks.getLoginPathByPortal).toHaveBeenCalledWith('user')
    expect(mocks.clearQueryClientAtAuthBoundary).toHaveBeenCalledOnce()
    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(mocks.navigate).toHaveBeenCalledWith('/user/login', { replace: true })
    expect(mocks.clearQueryClientAtAuthBoundary.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.logout.mock.invocationCallOrder[0]
    )
    expect(mocks.logout.mock.invocationCallOrder[0]).toBeLessThan(mocks.navigate.mock.invocationCallOrder[0])
  })

  it('uses the default login route when the auth portal is missing', () => {
    mocks.getState.mockReturnValue({ portal: null, logout: mocks.logout })
    const { result } = renderHook(() => useLogout())

    result.current()

    expect(mocks.getDefaultLoginPath).toHaveBeenCalledOnce()
    expect(mocks.getLoginPathByPortal).not.toHaveBeenCalled()
    expect(mocks.navigate).toHaveBeenCalledWith('/user/login', { replace: true })
  })
})
