import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getStudentsDdl } from '@/services/ddl/students.ddl.service'
import { normalizeStudentSubGroupIds, useStudentsMultiDdl } from './useStudentsMultiDdl'

vi.mock('@/services/ddl/students.ddl.service', () => ({ getStudentsDdl: vi.fn() }))

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useStudentsMultiDdl', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes empty, duplicate, and reordered Subgroups deterministically', () => {
    expect(normalizeStudentSubGroupIds(['sub-2', '', 'sub-1', 'sub-2', null])).toEqual(['sub-1', 'sub-2'])
  })

  it('does not request without Subgroups or while disabled', () => {
    const { result } = renderHook(() => useStudentsMultiDdl({ subGroupIds: [], enabled: false }), {
      wrapper: createWrapper(),
    })
    expect(result.current.isDisabled).toBe(true)
    expect(getStudentsDdl).not.toHaveBeenCalled()
  })

  it('runs one cached request per unique Subgroup and deduplicates Students by UUID', async () => {
    vi.mocked(getStudentsDdl).mockImplementation(async ({ group }) =>
      group === 'sub-1'
        ? [
            { value: 'student-1', student_id: 'student-1', label: 'Ahmed' },
            { value: 'shared', student_id: 'shared', label: 'Shared' },
          ]
        : [
            { value: 'shared', student_id: 'shared', label: 'Shared' },
            { value: 'student-2', student_id: 'student-2', label: 'Mona' },
          ]
    )
    const { result, rerender } = renderHook(({ ids }) => useStudentsMultiDdl({ subGroupIds: ids }), {
      initialProps: { ids: ['sub-2', 'sub-1', 'sub-1'] },
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(getStudentsDdl).toHaveBeenCalledTimes(2)
    expect(result.current.students.map(({ value }) => value)).toEqual(['student-1', 'shared', 'student-2'])
    rerender({ ids: ['sub-1', 'sub-2'] })
    expect(getStudentsDdl).toHaveBeenCalledTimes(2)
  })

  it('can request multi Subgroups as a comma-separated group parameter', async () => {
    vi.mocked(getStudentsDdl).mockResolvedValue([{ value: 'student-1', student_id: 'student-1', label: 'Ahmed' }])

    const { result } = renderHook(
      () => useStudentsMultiDdl({ subGroupIds: ['sub-2', 'sub-1', 'sub-1'], requestMode: 'comma-separated' }),
      {
        wrapper: createWrapper(),
      }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(getStudentsDdl).toHaveBeenCalledTimes(1)
    expect(getStudentsDdl).toHaveBeenCalledWith({ group: 'sub-1,sub-2' }, expect.any(AbortSignal))
    expect(result.current.students.map(({ value }) => value)).toEqual(['student-1'])
  })

  it('cancels an obsolete Students request when its Subgroup is removed', async () => {
    let requestSignal: AbortSignal | undefined
    vi.mocked(getStudentsDdl).mockImplementation(
      (_params, signal) =>
        new Promise(() => {
          requestSignal = signal
        })
    )

    const { rerender } = renderHook(({ ids }) => useStudentsMultiDdl({ subGroupIds: ids }), {
      initialProps: { ids: ['sub-1'] },
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(requestSignal).toBeDefined())
    rerender({ ids: [] })
    await waitFor(() => expect(requestSignal?.aborted).toBe(true))
  })

  it('preserves successful options and exposes retry for a partial failure', async () => {
    vi.mocked(getStudentsDdl).mockImplementation(async ({ group }) => {
      if (group === 'sub-2') throw new Error('failed')
      return [{ value: 'student-1', student_id: 'student-1', label: 'Ahmed' }]
    })
    const { result } = renderHook(() => useStudentsMultiDdl({ subGroupIds: ['sub-1', 'sub-2'] }), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isPartialError).toBe(true))
    expect(result.current.students).toHaveLength(1)
    await result.current.retry()
    expect(getStudentsDdl).toHaveBeenCalledTimes(3)
  })
})
