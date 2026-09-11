import { QueryClientProvider, useMutation } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getQueryClientAuthBoundaryEpoch, queryClient } from '@/lib/react-query/query-client'
import { AUTH_STORAGE_KEY, useAuth } from '@/store/auth'

import type { AppRole, AuthPortal, IUser } from '@/modules/auth/types/auth.types'

import { AuthStorageSync } from './AuthStorageSync'

const privateQueryKey = ['private-user-data'] as const

function createUser(id: string, role: AppRole, name = `User ${id}`): IUser {
  return {
    id,
    role,
    type: role,
    name,
    phone: null,
    group: {
      id: 'group-1',
      name: 'Group',
      parent: { id: 'main-group-1', name: 'Main group' },
    },
  }
}

function setAuthenticatedState({
  id,
  portal,
  role,
  token = 'current-token',
}: {
  id: string
  portal: AuthPortal
  role: AppRole
  token?: string
}) {
  useAuth.setState({
    token,
    role,
    portal,
    user: createUser(id, role),
    isAuthenticated: true,
  })
}

function storeAuthenticatedState({
  id,
  name,
  portal,
  role,
  token = 'stored-token',
}: {
  id: string
  name?: string
  portal: AuthPortal
  role: AppRole
  token?: string
}) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token,
      role,
      portal,
      persistence: 'persistent',
      user: createUser(id, role, name),
    })
  )
}

function dispatchAuthStorageEvent() {
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: AUTH_STORAGE_KEY,
      storageArea: localStorage,
    })
  )
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function PendingMutation({
  promise,
  onHookSettled,
  onHookSuccess,
  onMutateSettled,
  onMutateSuccess,
}: {
  promise: Promise<string>
  onHookSettled: () => void
  onHookSuccess: () => void
  onMutateSettled: () => void
  onMutateSuccess: () => void
}) {
  const { mutate, status } = useMutation({
    mutationFn: () => promise,
    onMutate: () => ({ authBoundaryEpoch: getQueryClientAuthBoundaryEpoch() }),
    onSuccess: (data, _variables, context) => {
      onHookSuccess()

      if (context?.authBoundaryEpoch === getQueryClientAuthBoundaryEpoch()) {
        queryClient.setQueryData(['retired-hook-success'], data)
      }
    },
    onSettled: () => {
      onHookSettled()
    },
  })

  useEffect(() => {
    mutate(undefined, {
      onSuccess: (data, _variables, context) => {
        onMutateSuccess()

        if (context?.authBoundaryEpoch === getQueryClientAuthBoundaryEpoch()) {
          queryClient.setQueryData(['retired-mutate-success'], data)
        }
      },
      onSettled: () => {
        onMutateSettled()
      },
    })
  }, [mutate, onMutateSettled, onMutateSuccess])

  return <span>{status}</span>
}

describe('AuthStorageSync query-cache boundaries', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    queryClient.clear()
    useAuth.setState({
      token: null,
      role: null,
      portal: null,
      user: null,
      isAuthenticated: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    queryClient.clear()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('cancels and clears private queries when another tab logs out', () => {
    setAuthenticatedState({ id: 'student-1', portal: 'user', role: 'student' })
    queryClient.setQueryData(privateQueryKey, { owner: 'student-1' })

    const cancelQueries = vi.spyOn(queryClient, 'cancelQueries')
    const clear = vi.spyOn(queryClient, 'clear')
    const previousEpoch = getQueryClientAuthBoundaryEpoch()
    render(<AuthStorageSync />)

    dispatchAuthStorageEvent()

    expect(useAuth.getState().isAuthenticated).toBe(false)
    expect(queryClient.getQueryData(privateQueryKey)).toBeUndefined()
    expect(getQueryClientAuthBoundaryEpoch()).toBe(previousEpoch + 1)
    expect(cancelQueries).toHaveBeenCalledOnce()
    expect(clear).toHaveBeenCalledOnce()
    expect(cancelQueries.mock.invocationCallOrder[0]).toBeLessThan(clear.mock.invocationCallOrder[0])
  })

  it.each([
    {
      label: 'authenticated user',
      current: { id: 'student-1', portal: 'user' as const, role: 'student' as const },
      stored: { id: 'student-2', portal: 'user' as const, role: 'student' as const },
    },
    {
      label: 'role',
      current: { id: 'staff-1', portal: 'teacher' as const, role: 'teacher' as const },
      stored: { id: 'staff-1', portal: 'teacher' as const, role: 'admin' as const },
    },
    {
      label: 'portal',
      current: { id: 'person-1', portal: 'user' as const, role: 'student' as const },
      stored: { id: 'person-1', portal: 'teacher' as const, role: 'teacher' as const },
    },
  ])('clears private queries when another tab changes the $label', ({ current, stored }) => {
    setAuthenticatedState(current)
    storeAuthenticatedState(stored)
    queryClient.setQueryData(privateQueryKey, { owner: current.id })
    render(<AuthStorageSync />)

    dispatchAuthStorageEvent()

    expect(useAuth.getState()).toMatchObject({
      isAuthenticated: true,
      portal: stored.portal,
      role: stored.role,
      user: { id: stored.id },
    })
    expect(queryClient.getQueryData(privateQueryKey)).toBeUndefined()
  })

  it('preserves queries for a same-identity token and profile refresh', () => {
    setAuthenticatedState({
      id: 'student-1',
      portal: 'user',
      role: 'student',
      token: 'old-token',
    })
    storeAuthenticatedState({
      id: 'student-1',
      name: 'Updated Student',
      portal: 'user',
      role: 'student',
      token: 'refreshed-token',
    })
    const cachedData = { owner: 'student-1' }
    queryClient.setQueryData(privateQueryKey, cachedData)
    const clear = vi.spyOn(queryClient, 'clear')
    const previousEpoch = getQueryClientAuthBoundaryEpoch()
    render(<AuthStorageSync />)

    dispatchAuthStorageEvent()

    expect(useAuth.getState()).toMatchObject({
      token: 'refreshed-token',
      user: { id: 'student-1', name: 'Updated Student' },
    })
    expect(queryClient.getQueryData(privateQueryKey)).toEqual(cachedData)
    expect(getQueryClientAuthBoundaryEpoch()).toBe(previousEpoch)
    expect(clear).not.toHaveBeenCalled()
  })

  it('keeps pending mutation cleanup callbacks active while explicit epoch checks fence stale cache writes', async () => {
    setAuthenticatedState({ id: 'student-1', portal: 'user', role: 'student' })
    const deferred = createDeferred<string>()
    const callbacks = {
      onHookSettled: vi.fn(),
      onHookSuccess: vi.fn(),
      onMutateSettled: vi.fn(),
      onMutateSuccess: vi.fn(),
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthStorageSync />
        <PendingMutation promise={deferred.promise} {...callbacks} />
      </QueryClientProvider>
    )

    expect(await screen.findByText('pending')).toBeInTheDocument()
    const retiredMutation = queryClient.getMutationCache().getAll()[0]

    expect(retiredMutation).toBeDefined()

    act(() => {
      dispatchAuthStorageEvent()
    })

    expect(screen.getByText('pending')).toBeInTheDocument()

    await act(async () => {
      deferred.resolve('prior-user-result')
      await deferred.promise
    })
    await waitFor(() => {
      expect(retiredMutation?.state.status).toBe('success')
      expect(screen.getByText('success')).toBeInTheDocument()
    })

    expect(callbacks.onHookSuccess).toHaveBeenCalledOnce()
    expect(callbacks.onHookSettled).toHaveBeenCalledOnce()
    expect(callbacks.onMutateSuccess).toHaveBeenCalledOnce()
    expect(callbacks.onMutateSettled).toHaveBeenCalledOnce()

    expect(queryClient.getQueryData(['retired-hook-success'])).toBeUndefined()
    expect(queryClient.getQueryData(['retired-mutate-success'])).toBeUndefined()
  })
})
