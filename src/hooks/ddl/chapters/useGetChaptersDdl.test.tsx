import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getChaptersDdl = vi.hoisted(() => vi.fn())

vi.mock('@/services/ddl/chapters.ddl.service', () => ({ getChaptersDdl }))

import useGetChaptersDdl, { useGetChaptersByGroupIdsDdl } from './useGetChaptersDdl'

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useGetChaptersDdl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getChaptersDdl.mockResolvedValue([])
  })

  it('does not request Chapters before a Subgroup is selected', () => {
    renderHook(() => useGetChaptersDdl({ groupIds: [] }), { wrapper: createWrapper() })

    expect(getChaptersDdl).not.toHaveBeenCalled()
  })

  it('changes the query when the normalized Subgroup set changes', async () => {
    const { rerender } = renderHook(({ groupIds }) => useGetChaptersDdl({ groupIds }), {
      initialProps: { groupIds: ['sub-1'] },
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(getChaptersDdl).toHaveBeenCalledTimes(1))
    rerender({ groupIds: ['sub-1'] })
    expect(getChaptersDdl).toHaveBeenCalledTimes(1)

    rerender({ groupIds: ['sub-2'] })
    await waitFor(() => expect(getChaptersDdl).toHaveBeenCalledTimes(2))
    expect(getChaptersDdl.mock.calls.map(([params]) => params)).toEqual([
      { groupIds: ['sub-1'] },
      { groupIds: ['sub-2'] },
    ])
  })

  it('makes one request for the normalized set and renders the backend result directly', async () => {
    const backendChapters = [
      { value: 'chapter-a', label: 'A' },
      { value: 'chapter-b', label: 'B' },
    ]
    getChaptersDdl.mockImplementation(async ({ groupIds }: { groupIds: readonly string[] }, signal: AbortSignal) => {
      expect(signal).toBeInstanceOf(AbortSignal)
      expect(groupIds).toEqual(['sub-1', 'sub-2', 'sub-3'])
      return backendChapters
    })

    const { result, rerender } = renderHook(({ ids }) => useGetChaptersByGroupIdsDdl(ids), {
      initialProps: { ids: ['sub-3', 'sub-1', 'sub-2', 'sub-1'] },
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.groupIds).toEqual(['sub-1', 'sub-2', 'sub-3'])
    expect(getChaptersDdl).toHaveBeenCalledOnce()
    expect(result.current.data).toEqual(backendChapters)

    rerender({ ids: ['sub-2', 'sub-3', 'sub-1'] })
    expect(getChaptersDdl).toHaveBeenCalledOnce()
  })

  it('does not request Chapters without selected Subgroups', () => {
    const { result } = renderHook(() => useGetChaptersByGroupIdsDdl([]), { wrapper: createWrapper() })

    expect(result.current.isDisabled).toBe(true)
    expect(result.current.data).toEqual([])
    expect(getChaptersDdl).not.toHaveBeenCalled()
  })

  it('exposes the single-query error and retry state', async () => {
    getChaptersDdl.mockRejectedValueOnce(new Error('failed')).mockResolvedValueOnce([])

    const { result } = renderHook(() => useGetChaptersByGroupIdsDdl(['sub-1', 'sub-2']), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toEqual([])

    await result.current.refetch()
    expect(getChaptersDdl).toHaveBeenCalledTimes(2)
  })
})
