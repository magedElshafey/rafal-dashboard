import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { queryTimes } from '@/lib/react-query/query-times'
import { getAttendanceStatusesDdl } from '@/services/ddl/attendance-statuses.ddl.service'

import { ATTENDANCE_STATUSES_DDL_QUERY_KEY, useAttendanceStatusesDdl } from './useAttendanceStatusesDdl'

vi.mock('@/services/ddl/attendance-statuses.ddl.service', () => ({ getAttendanceStatusesDdl: vi.fn() }))

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useAttendanceStatusesDdl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the stable DDL key and long-lived cache settings', () => {
    vi.mocked(getAttendanceStatusesDdl).mockReturnValue(new Promise(() => undefined))
    const client = createClient()
    const { result } = renderHook(() => useAttendanceStatusesDdl(), { wrapper: createWrapper(client) })

    expect(result.current.isPending).toBe(true)
    const query = client.getQueryCache().find({ queryKey: ATTENDANCE_STATUSES_DDL_QUERY_KEY })
    expect(query?.options.gcTime).toBe(queryTimes.veryLong)
    expect(query?.options.retry).toBe(false)
  })

  it('shares one request across consumers and returns cached items', async () => {
    const statuses = [{ value: 'present', label: 'Present' }]
    vi.mocked(getAttendanceStatusesDdl).mockResolvedValue(statuses)
    const client = createClient()
    const wrapper = createWrapper(client)
    const first = renderHook(() => useAttendanceStatusesDdl(), { wrapper })
    const second = renderHook(() => useAttendanceStatusesDdl(), { wrapper })

    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    expect(second.result.current.data).toEqual(statuses)
    expect(getAttendanceStatusesDdl).toHaveBeenCalledTimes(1)
  })

  it('distinguishes empty success from an error without fallback statuses', async () => {
    vi.mocked(getAttendanceStatusesDdl).mockResolvedValueOnce([])
    const empty = renderHook(() => useAttendanceStatusesDdl(), { wrapper: createWrapper(createClient()) })
    await waitFor(() => expect(empty.result.current.isSuccess).toBe(true))
    expect(empty.result.current.data).toEqual([])

    vi.mocked(getAttendanceStatusesDdl).mockRejectedValueOnce(new Error('private error'))
    const failed = renderHook(() => useAttendanceStatusesDdl(), { wrapper: createWrapper(createClient()) })
    await waitFor(() => expect(failed.result.current.isError).toBe(true))
    expect(failed.result.current.data).toEqual([])
  })
})
