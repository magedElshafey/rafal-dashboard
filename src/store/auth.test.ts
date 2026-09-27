import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ loginRequest: vi.fn() }))

vi.mock('@/modules/auth/service/login.service', () => ({ loginRequest: mocks.loginRequest }))

import { AUTH_STORAGE_KEY, useAuth } from './auth'

const emptyState = {
  token: null,
  admin: null,
  isAuthenticated: false,
}

const admin = {
  id: 1,
  name: 'Super Admin',
  email: 'admin@example.com',
  roles: ['Super Admin'],
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    useAuth.setState(emptyState)
  })

  it('normalizes and persists the minimum dashboard session on login', async () => {
    mocks.loginRequest.mockResolvedValue({
      token: 'auth-token',
      admin,
      roles: ['Super Admin'],
    })

    await useAuth.getState().login({ email: 'admin@example.com', password: 'password' })

    expect(mocks.loginRequest).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'password',
    })
    expect(useAuth.getState()).toMatchObject({
      token: 'auth-token',
      admin,
      isAuthenticated: true,
    })
    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}')).toEqual({
      token: 'auth-token',
      admin,
    })
  })

  it('restores a persisted session without a me request', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: 'auth-token', admin }))

    useAuth.getState().syncFromStorage()

    expect(useAuth.getState()).toMatchObject({
      token: 'auth-token',
      admin,
      isAuthenticated: true,
    })
    expect(mocks.loginRequest).not.toHaveBeenCalled()
  })

  it('clears current and legacy session keys on logout', () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: 'auth-token', admin }))
    localStorage.setItem('auth_session', '{}')
    useAuth.setState({ token: 'auth-token', admin, isAuthenticated: true })

    useAuth.getState().logout()

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('auth_session')).toBeNull()
    expect(useAuth.getState()).toMatchObject(emptyState)
  })
})
