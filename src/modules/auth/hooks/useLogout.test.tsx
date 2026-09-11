import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useLogout } from './useLogout'

const mocks = vi.hoisted(() => ({
  clearQueryClientAtAuthBoundary: vi.fn(),
  logout: vi.fn(),
  navigate: vi.fn(),
  getState: vi.fn(),
}))

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }))
vi.mock('@/lib/react-query/query-client', () => ({
  clearQueryClientAtAuthBoundary: mocks.clearQueryClientAtAuthBoundary,
}))
vi.mock('@/store/auth', () => ({ useAuth: { getState: mocks.getState } }))

describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getState.mockReturnValue({ logout: mocks.logout })
  })

  it('clears private state before returning to the neutral login route', () => {
    const { result } = renderHook(() => useLogout())
    result.current()

    expect(mocks.clearQueryClientAtAuthBoundary).toHaveBeenCalledOnce()
    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(mocks.navigate).toHaveBeenCalledWith('/login', { replace: true })
    expect(mocks.clearQueryClientAtAuthBoundary.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.logout.mock.invocationCallOrder[0]
    )
  })
})
