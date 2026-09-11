import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { queryTimes } from '@/lib/react-query/query-times'
import { getNotificationChannelsDdl } from '@/services/ddl/notification-channels.ddl.service'

import { REMINDER_NOTIFICATION_CHANNELS_DDL_QUERY_KEY, useNotificationChannelsDdl } from './useNotificationChannelsDdl'

vi.mock('@/services/ddl/notification-channels.ddl.service', () => ({ getNotificationChannelsDdl: vi.fn() }))

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useNotificationChannelsDdl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the reminders DDL key and long-lived cache settings by default', () => {
    vi.mocked(getNotificationChannelsDdl).mockReturnValue(new Promise(() => undefined))
    const client = createClient()
    const { result } = renderHook(() => useNotificationChannelsDdl(), { wrapper: createWrapper(client) })

    expect(result.current.isPending).toBe(true)
    const query = client.getQueryCache().find({ queryKey: REMINDER_NOTIFICATION_CHANNELS_DDL_QUERY_KEY })
    expect(query?.options.gcTime).toBe(queryTimes.veryLong)
  })

  it('requests reminder channels once and keeps an empty fallback while loading', async () => {
    const channels = [{ value: 'in_app', label: 'التطبيق' }]
    vi.mocked(getNotificationChannelsDdl).mockResolvedValue(channels)
    const client = createClient()
    const wrapper = createWrapper(client)
    const first = renderHook(() => useNotificationChannelsDdl(), { wrapper })
    const second = renderHook(() => useNotificationChannelsDdl(), { wrapper })

    expect(first.result.current.data).toEqual([])
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    expect(second.result.current.data).toEqual(channels)
    expect(getNotificationChannelsDdl).toHaveBeenCalledWith('reminders')
    expect(getNotificationChannelsDdl).toHaveBeenCalledTimes(1)
  })
})
