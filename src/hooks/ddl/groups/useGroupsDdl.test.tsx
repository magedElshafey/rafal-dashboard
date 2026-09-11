import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMainGroupsDdl, getSubGroupsDdl } from '@/services/ddl/groups.ddl.service'

import { normalizeGroupIds, useMainGroupsDdl, useSubGroupsByGroupIdsDdl, useSubGroupsDdl } from './useGroupsDdl'

vi.mock('@/services/ddl/groups.ddl.service', () => ({
  getMainGroupsDdl: vi.fn(),
  getSubGroupsDdl: vi.fn(),
}))

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('group DDL queries', () => {
  beforeEach(() => vi.clearAllMocks())

  it('preserves enriched Main Group fields and forwards cancellation', async () => {
    vi.mocked(getMainGroupsDdl).mockResolvedValue([{ value: 'group-1', label: 'Group 1', sub_groups_count: 3 }])

    const { result } = renderHook(useMainGroupsDdl, { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual([{ value: 'group-1', label: 'Group 1', sub_groups_count: 3 }])
    expect(getMainGroupsDdl).toHaveBeenCalledWith(expect.any(AbortSignal))
  })

  it('normalizes empty, duplicate, whitespace, and reordered IDs deterministically', () => {
    expect(normalizeGroupIds(['group-2', '', ' group-1 ', 'group-2', null])).toEqual(['group-1', 'group-2'])
  })

  it('does not request Subgroups without a selected Main Group', () => {
    const { result } = renderHook(() => useSubGroupsByGroupIdsDdl([]), { wrapper: createWrapper() })

    expect(result.current.isDisabled).toBe(true)
    expect(getSubGroupsDdl).not.toHaveBeenCalled()
  })

  it('runs one cached request per unique Main Group and ignores selection order', async () => {
    vi.mocked(getSubGroupsDdl).mockImplementation(async (groupId) => [
      { value: `sub-${groupId}`, label: `Subgroup ${groupId}` },
    ])

    const { result, rerender } = renderHook(({ ids }) => useSubGroupsByGroupIdsDdl(ids), {
      initialProps: { ids: ['group-2', 'group-1', 'group-1'] },
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(getSubGroupsDdl).toHaveBeenCalledTimes(2)
    expect(result.current.data.map(({ value }) => value)).toEqual(['sub-group-1', 'sub-group-2'])

    rerender({ ids: ['group-1', 'group-2'] })
    expect(getSubGroupsDdl).toHaveBeenCalledTimes(2)
  })

  it('shares the singular Subgroup cache and forwards cancellation signals', async () => {
    vi.mocked(getSubGroupsDdl).mockResolvedValue([{ value: 'sub-1', label: 'Subgroup 1' }])

    const { result } = renderHook(
      () => ({ singular: useSubGroupsDdl('group-1'), multiple: useSubGroupsByGroupIdsDdl(['group-1']) }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.multiple.isLoading).toBe(false))
    expect(getSubGroupsDdl).toHaveBeenCalledTimes(1)
    expect(getSubGroupsDdl).toHaveBeenCalledWith('group-1', expect.any(AbortSignal))
  })

  it('cancels an obsolete Subgroup request when its Main Group is removed', async () => {
    let requestSignal: AbortSignal | undefined
    vi.mocked(getSubGroupsDdl).mockImplementation(
      (_groupId, signal) =>
        new Promise(() => {
          requestSignal = signal
        })
    )

    const { rerender } = renderHook(({ ids }) => useSubGroupsByGroupIdsDdl(ids), {
      initialProps: { ids: ['group-1'] },
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(requestSignal).toBeDefined())
    rerender({ ids: [] })
    await waitFor(() => expect(requestSignal?.aborted).toBe(true))
  })

  it('preserves successful branches and retries only a failed Main Group branch', async () => {
    vi.mocked(getSubGroupsDdl).mockImplementation(async (groupId) => {
      if (groupId === 'group-2') throw new Error('failed')
      return [{ value: 'sub-1', label: 'Subgroup 1' }]
    })

    const { result } = renderHook(() => useSubGroupsByGroupIdsDdl(['group-1', 'group-2']), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isPartialError).toBe(true))
    expect(result.current.data).toEqual([{ value: 'sub-1', label: 'Subgroup 1' }])

    await result.current.refetch()
    expect(getSubGroupsDdl).toHaveBeenCalledTimes(3)
  })
})
