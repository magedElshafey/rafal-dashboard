import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'

describe('useInfinitePaginatedQuery', () => {
  it('uses next_page_url when the API omits total_pages and stops on an empty URL', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const queryFn = vi.fn((page: number) =>
      Promise.resolve({
        items: [`page-${page}`],
        extra: null,
        paginate: {
          total: 2,
          count: 1,
          per_page: 15,
          current_page: page,
          next_page_url: page === 1 ? '/sessions?page=2' : '',
          prev_page_url: '',
        } as Pagination,
      })
    )
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useInfinitePaginatedQuery({ queryKey: ['next-url-pagination'], queryFn }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.hasNextPage).toBe(true))
    await act(async () => result.current.fetchNextPage())

    await waitFor(() => expect(result.current.hasNextPage).toBe(false))
    expect(result.current.data?.pages.flatMap((page) => page.items)).toEqual(['page-1', 'page-2'])
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('forwards TanStack Query abort signals to the page query function', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    let receivedSignal: AbortSignal | undefined
    const queryFn = vi.fn((_page: number, signal?: AbortSignal) => {
      receivedSignal = signal

      return new Promise<PaginatedData<string>>(() => undefined)
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { unmount } = renderHook(
      () =>
        useInfinitePaginatedQuery({
          queryKey: ['infinite-signal'],
          queryFn,
        }),
      { wrapper }
    )

    await waitFor(() => expect(receivedSignal).toBeDefined())
    expect(queryFn).toHaveBeenCalledWith(1, receivedSignal)
    expect(receivedSignal?.aborted).toBe(false)

    await act(async () => {
      await queryClient.cancelQueries({ queryKey: ['infinite-signal'] })
    })

    expect(receivedSignal?.aborted).toBe(true)

    unmount()
    queryClient.clear()
  })
})
