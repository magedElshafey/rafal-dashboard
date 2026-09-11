import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { queryTimes } from '@/lib/react-query/query-times'
import { getNotificationTypesDdl } from '@/services/ddl/notification-types.ddl.service'

import { NOTIFICATION_TYPES_DDL_QUERY_KEY, useNotificationTypesDdl } from './useNotificationTypesDdl'

vi.mock('@/services/ddl/notification-types.ddl.service', () => ({ getNotificationTypesDdl: vi.fn() }))

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useNotificationTypesDdl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the stable user DDL key and long-lived cache settings', () => {
    vi.mocked(getNotificationTypesDdl).mockReturnValue(new Promise(() => undefined))
    const client = createClient()
    const { result } = renderHook(() => useNotificationTypesDdl(), { wrapper: createWrapper(client) })

    expect(result.current.isPending).toBe(true)
    const query = client.getQueryCache().find({ queryKey: NOTIFICATION_TYPES_DDL_QUERY_KEY })
    expect(query?.options.gcTime).toBe(queryTimes.veryLong)
  })

  it('shares one request and keeps All usable through an empty fallback', async () => {
    const types = [{ value: 'assignment', label: 'Assignments' }]
    vi.mocked(getNotificationTypesDdl).mockResolvedValue(types)
    const client = createClient()
    const wrapper = createWrapper(client)
    const first = renderHook(() => useNotificationTypesDdl(), { wrapper })
    const second = renderHook(() => useNotificationTypesDdl(), { wrapper })

    expect(first.result.current.data).toEqual([])
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    expect(second.result.current.data).toEqual(types)
    expect(getNotificationTypesDdl).toHaveBeenCalledTimes(1)
  })

  it('does not expose a raw failed response as type options', async () => {
    vi.mocked(getNotificationTypesDdl).mockRejectedValue(new Error('private error'))
    const failed = renderHook(() => useNotificationTypesDdl(), { wrapper: createWrapper(createClient()) })

    await waitFor(() => expect(failed.result.current.isError).toBe(true))
    expect(failed.result.current.data).toEqual([])
  })

  it.each(['admin', 'assistant'])('keys and requests teacher portal types with actor=%s', async (actor) => {
    vi.mocked(getNotificationTypesDdl).mockResolvedValue([])
    const client = createClient()
    const result = renderHook(() => useNotificationTypesDdl(actor), { wrapper: createWrapper(client) })

    await waitFor(() => expect(result.result.current.isSuccess).toBe(true))
    expect(getNotificationTypesDdl).toHaveBeenCalledWith(actor)
    expect(client.getQueryCache().find({ queryKey: ['ddl', 'notification-types', actor] })).toBeDefined()
  })

  it('does not request types when the authenticated role is ineligible', () => {
    renderHook(() => useNotificationTypesDdl('teacher', { enabled: false }), {
      wrapper: createWrapper(createClient()),
    })
    expect(getNotificationTypesDdl).not.toHaveBeenCalled()
  })
})
