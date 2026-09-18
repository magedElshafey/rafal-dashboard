import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { useCreateRegion } from './useCreateRegion'
import { useDeleteRegion } from './useDeleteRegion'
import { useUpdateRegion } from './useUpdateRegion'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { invalidate, wrapper }
}

describe('region mutation cache ownership', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('invalidates only region lists after create', async () => {
    const { invalidate, wrapper } = setup()
    const { result } = renderHook(useCreateRegion, { wrapper })
    await act(() => result.current.mutateAsync({ name: { ar: 'أ', en: 'A' }, isActive: true }))
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['regions', 'list'] })
  })

  it('invalidates only region lists after update', async () => {
    const { invalidate, wrapper } = setup()
    const { result } = renderHook(() => useUpdateRegion(1), { wrapper })
    await act(() => result.current.mutateAsync({ name: { ar: 'ب', en: 'B' }, isActive: false }))
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['regions', 'list'] })
  })

  it('invalidates only region lists after delete', async () => {
    const { invalidate, wrapper } = setup()
    const { result } = renderHook(useDeleteRegion, { wrapper })
    await act(() => result.current.mutateAsync(1))
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['regions', 'list'] })
  })
})
