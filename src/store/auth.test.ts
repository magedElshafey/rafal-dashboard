import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ loginRequest: vi.fn() }))

vi.mock('@/modules/auth/service/login.service', () => ({ loginRequest: mocks.loginRequest }))

import { AUTH_STORAGE_KEY, useAuth } from './auth'

const emptyState = {
  token: null,
  role: null,
  user: null,
  isAuthenticated: false,
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    useAuth.setState(emptyState)
  })

  it('logs in through the neutral endpoint and stores no portal state', async () => {
    mocks.loginRequest.mockResolvedValue({
      token: 'auth-token',
      user: { id: '1', name: 'Admin', phone: null, role: 'backend-role' },
    })

    await useAuth.getState().login({
      phone: '1000000000',
      password: 'password',
      rememberMe: true,
      countryCode: '+20',
    })

    expect(mocks.loginRequest).toHaveBeenCalledWith({
      phone: '1000000000',
      password: 'password',
      rememberMe: true,
      countryCode: '+20',
    })
    expect(useAuth.getState()).toMatchObject({
      token: 'auth-token',
      role: 'backend-role',
      user: { id: '1', name: 'Admin' },
      isAuthenticated: true,
    })

    const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}') as Record<string, unknown>
    expect(stored).not.toHaveProperty('portal')
  })

  it('clears both current and legacy session keys on logout', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, '{}')
    localStorage.setItem('auth_session', '{}')

    useAuth.getState().logout()

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('auth_session')).toBeNull()
  })
})
