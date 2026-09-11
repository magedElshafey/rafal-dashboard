import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAssistantsDdl } from '@/services/ddl/assistants.ddl.service'

import { assistantsDdlQueryKeys } from './assistants-ddl.query-keys'
import { useAssistantsDdl } from './useAssistantsDdl'

vi.mock('@/services/ddl/assistants.ddl.service', () => ({ getAssistantsDdl: vi.fn() }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })

  return { promise, resolve }
}

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useAssistantsDdl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('separates normalized Subgroup caches from the unfiltered cache', () => {
    expect(assistantsDdlQueryKeys.bySubGroup('sub-1')).toEqual(['ddl', 'assistants', 'subgroup', 'sub-1'])
    expect(assistantsDdlQueryKeys.unfiltered()).toEqual(['ddl', 'assistants', 'unfiltered'])
  })

  it('stays disabled until a subgroup exists', () => {
    const { result } = renderHook(() => useAssistantsDdl(''), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toEqual([])
    expect(getAssistantsDdl).not.toHaveBeenCalled()
  })

  it('fetches with the selected subgroup and caches its options', async () => {
    vi.mocked(getAssistantsDdl).mockResolvedValue([{ value: 'assistant-1', label: 'Mona' }])
    const { result } = renderHook(() => useAssistantsDdl('sub-1'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getAssistantsDdl).toHaveBeenCalledWith({ group: 'sub-1' })
    expect(result.current.data).toEqual([{ value: 'assistant-1', label: 'Mona' }])
  })

  it('does not duplicate the scoped request when the same subgroup rerenders', async () => {
    vi.mocked(getAssistantsDdl).mockResolvedValue([{ value: 'assistant-1', label: 'Mona' }])
    const { result, rerender } = renderHook(() => useAssistantsDdl(' sub-1 '), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender()

    expect(getAssistantsDdl).toHaveBeenCalledTimes(1)
    expect(getAssistantsDdl).toHaveBeenCalledWith({ group: 'sub-1' })
  })

  it('clears prior options on subgroup change and ignores a late response from the previous subgroup', async () => {
    const subGroupA = deferred<IDDl[]>()
    const subGroupB = deferred<IDDl[]>()
    vi.mocked(getAssistantsDdl).mockImplementation((params) => {
      return params?.group === 'sub-1' ? subGroupA.promise : subGroupB.promise
    })

    const { result, rerender } = renderHook(({ subGroupId }) => useAssistantsDdl(subGroupId), {
      initialProps: { subGroupId: 'sub-1' },
      wrapper: createWrapper(),
    })

    expect(getAssistantsDdl).toHaveBeenCalledWith({ group: 'sub-1' })

    rerender({ subGroupId: 'sub-2' })

    expect(result.current.data).toEqual([])
    expect(getAssistantsDdl).toHaveBeenLastCalledWith({ group: 'sub-2' })

    subGroupA.resolve([{ value: 'assistant-a', label: 'Assistant A' }])
    await waitFor(() => expect(getAssistantsDdl).toHaveBeenCalledTimes(2))
    expect(result.current.data).toEqual([])

    subGroupB.resolve([{ value: 'assistant-b', label: 'Assistant B' }])
    await waitFor(() => expect(result.current.data).toEqual([{ value: 'assistant-b', label: 'Assistant B' }]))
  })

  it('uses a distinct unfiltered cache and omits group_id in create mode', async () => {
    vi.mocked(getAssistantsDdl).mockResolvedValue([{ value: 'assistant-2', label: 'Nour' }])
    const { result } = renderHook(() => useAssistantsDdl(undefined, 'unfiltered'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(getAssistantsDdl).toHaveBeenCalledWith({})
    expect(result.current.data).toEqual([{ value: 'assistant-2', label: 'Nour' }])
  })
})
