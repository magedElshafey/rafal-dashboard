import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ loginRequest: vi.fn() }))

vi.mock('@/modules/auth/service/login.service', () => ({ loginRequest: mocks.loginRequest }))

import { AUTH_STORAGE_KEY, useAuth } from './auth'
import {
  queryClient,
  clearQueryClientAtAuthBoundary,
  getQueryClientAuthBoundaryEpoch,
} from '@/lib/react-query/query-client'

const emptyState = {
  effectivePermissions: null,
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
  it('never persists verified grants and clears them on storage restoration', () => {
    const original = JSON.stringify({ token: 'grant-session', admin })
    localStorage.setItem(AUTH_STORAGE_KEY, original)
    useAuth.getState().syncFromStorage()
    useAuth.getState().setVerifiedPermissions('grant-session', ['affiliates.view'])
    expect(useAuth.getState().effectivePermissions).toEqual(['affiliates.view'])
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBe(original)
    useAuth.getState().setVerifiedPermissions('grant-session', null)
    expect(useAuth.getState().effectivePermissions).toBeNull()
    useAuth.getState().setVerifiedPermissions('grant-session', [])
    expect(useAuth.getState().effectivePermissions).toEqual([])
    useAuth.getState().syncFromStorage()
    expect(useAuth.getState().effectivePermissions).toBeNull()
  })
  beforeEach(() => {
    clearQueryClientAtAuthBoundary()
    localStorage.clear()
    vi.clearAllMocks()
    useAuth.setState(emptyState)
  })
  it.each([{ grants: [] }, { grants: ['affiliates.settings.manage'] }])(
    'invalidates the obsolete grant snapshot for $grants',
    async ({ grants }) => {
      useAuth.setState({ token: 'grant-session', isAuthenticated: true, effectivePermissions: ['affiliates.view'] })
      queryClient.setQueryData(['affiliates', 'list'], ['private-old-data'])
      queryClient.setQueryData(['unrelated'], 'retained')
      let finish!: (value: string) => void
      let signal!: AbortSignal
      const pending = queryClient
        .fetchQuery({
          queryKey: ['affiliates', 'detail', 1],
          queryFn: (context) => {
            signal = context.signal
            return new Promise<string>((resolve) => {
              finish = resolve
            })
          },
        })
        .catch(() => undefined)
      const epoch = getQueryClientAuthBoundaryEpoch()
      useAuth.getState().setVerifiedPermissions('grant-session', grants)
      expect(getQueryClientAuthBoundaryEpoch()).toBeGreaterThan(epoch)
      expect(signal.aborted).toBe(true)
      expect(queryClient.getQueryData(['affiliates', 'list'])).toBeUndefined()
      expect(queryClient.getQueryData(['unrelated'])).toBe('retained')
      finish('late-private-data')
      await pending
      await Promise.resolve()
      expect(queryClient.getQueryData(['affiliates', 'detail', 1])).toBeUndefined()
    }
  )
  it('does not invalidate for equivalent grants or a stale hydration response', () => {
    useAuth.setState({
      token: 'grant-session',
      isAuthenticated: true,
      effectivePermissions: ['affiliates.view', 'affiliates.manage'],
    })
    queryClient.setQueryData(['affiliates', 'list'], ['current'])
    const snapshot = useAuth.getState().effectivePermissions
    const epoch = getQueryClientAuthBoundaryEpoch()
    useAuth
      .getState()
      .setVerifiedPermissions('grant-session', ['affiliates.manage', 'affiliates.view', 'affiliates.view'])
    useAuth.getState().setVerifiedPermissions('old-session', [])
    expect(getQueryClientAuthBoundaryEpoch()).toBe(epoch)
    expect(useAuth.getState().effectivePermissions).toBe(snapshot)
    expect(queryClient.getQueryData(['affiliates', 'list'])).toEqual(['current'])
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
