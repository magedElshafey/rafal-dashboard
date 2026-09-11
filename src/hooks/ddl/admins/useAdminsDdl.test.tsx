import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAdminsDdl } from '@/services/ddl/admins.ddl.service'

import { adminsDdlQueryKeys } from './admins-ddl.query-keys'
import { useAdminsDdl } from './useAdminsDdl'

vi.mock('@/services/ddl/admins.ddl.service', () => ({ getAdminsDdl: vi.fn() }))

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useAdminsDdl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses a stable admins dropdown cache key', () => {
    expect(adminsDdlQueryKeys.all).toEqual(['ddl', 'admins'])
  })

  it('stays disabled until admin selection is needed', () => {
    const { result } = renderHook(() => useAdminsDdl(false), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toEqual([])
    expect(getAdminsDdl).not.toHaveBeenCalled()
  })

  it('fetches admins when enabled', async () => {
    vi.mocked(getAdminsDdl).mockResolvedValue([{ value: 'admin-1', label: 'Admin Account' }])

    const { result } = renderHook(() => useAdminsDdl(true), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getAdminsDdl).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual([{ value: 'admin-1', label: 'Admin Account' }])
  })
})
