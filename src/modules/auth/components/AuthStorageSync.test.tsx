import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getQueryClientAuthBoundaryEpoch, queryClient } from '@/lib/react-query/query-client'
import { AUTH_STORAGE_KEY, useAuth } from '@/store/auth'

import { AuthStorageSync } from './AuthStorageSync'

describe('AuthStorageSync', () => {
  beforeEach(() => {
    localStorage.clear()
    queryClient.clear()
    useAuth.setState({ token: null, role: null, user: null, isAuthenticated: false })
  })

  it('clears private queries when another tab logs out', () => {
    useAuth.setState({
      token: 'token',
      role: null,
      user: { id: '1', name: 'Admin', phone: null },
      isAuthenticated: true,
    })
    queryClient.setQueryData(['private-data'], { id: 1 })
    const previousEpoch = getQueryClientAuthBoundaryEpoch()
    render(<AuthStorageSync />)

    window.dispatchEvent(new StorageEvent('storage', { key: AUTH_STORAGE_KEY, storageArea: localStorage }))

    expect(useAuth.getState().isAuthenticated).toBe(false)
    expect(queryClient.getQueryData(['private-data'])).toBeUndefined()
    expect(getQueryClientAuthBoundaryEpoch()).toBe(previousEpoch + 1)
  })

  it('ignores unrelated local-storage updates', () => {
    const syncFromStorage = vi.spyOn(useAuth.getState(), 'syncFromStorage')
    render(<AuthStorageSync />)

    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated', storageArea: localStorage }))

    expect(syncFromStorage).not.toHaveBeenCalled()
  })
})
