import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useContactMessages } from '../hooks/useContactMessages'
import index from './contact-messages-index.fixture.json'
import { createClient, queryWrapper } from './test-utils'

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
beforeEach(() => vi.clearAllMocks())
describe('Contact Messages pagination', () => {
  it('uses last_page even for a short page and stops at the last page', async () => {
    http.get
      .mockResolvedValueOnce({ data: { ...index, data: [index.data[0]], meta: { ...index.meta, last_page: 2 } } })
      .mockResolvedValueOnce({
        data: { ...index, data: [index.data[1]], meta: { ...index.meta, current_page: 2, last_page: 2 } },
      })
    const { result } = renderHook(() => useContactMessages(), { wrapper: queryWrapper(createClient()) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(true)
    await act(async () => {
      await result.current.fetchNextPage()
    })
    await waitFor(() =>
      expect(result.current.data?.pages.flatMap((page) => page.items).map((item) => item.id)).toEqual([49, 41])
    )
    expect(http.get.mock.calls.map(([request]) => request.query)).toEqual([{ page: 1 }, { page: 2 }])
    await waitFor(() => expect(result.current.hasNextPage).toBe(false))
    await act(async () => {
      await result.current.fetchNextPage()
    })
    expect(http.get).toHaveBeenCalledTimes(2)
  })
  it('retains loaded data on next-page failure and retries only that page', async () => {
    http.get
      .mockResolvedValueOnce({ data: { ...index, meta: { ...index.meta, last_page: 2 } } })
      .mockRejectedValueOnce(new Error('Next page failed'))
      .mockResolvedValueOnce({ data: { ...index, data: [], meta: { ...index.meta, current_page: 2, last_page: 2 } } })
    const { result } = renderHook(() => useContactMessages(), { wrapper: queryWrapper(createClient()) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await act(async () => {
      await result.current.fetchNextPage()
    })
    await waitFor(() => expect(result.current.isFetchNextPageError).toBe(true))
    expect(result.current.data?.pages[0].items).toHaveLength(5)
    await act(async () => {
      await result.current.fetchNextPage()
    })
    expect(http.get.mock.calls.map(([request]) => request.query)).toEqual([{ page: 1 }, { page: 2 }, { page: 2 }])
    await waitFor(() => expect(result.current.hasNextPage).toBe(false))
  })
})
