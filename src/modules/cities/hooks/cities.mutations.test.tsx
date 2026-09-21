import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { citiesService } from '@/modules/cities/api/cities.service'
import { useDeleteCity } from './useDeleteCity'
import { useUpdateCity } from './useUpdateCity'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { invalidate, wrapper }
}

describe('City mutation cache ownership', () => {
  beforeEach(() => vi.restoreAllMocks())

  it.each([
    { nameEn: 'Riyadh New' },
    { center: { lat: 24.7, lng: 46.7 } },
    {
      boundary: [
        { lat: 1, lng: 1 },
        { lat: 2, lng: 2 },
        { lat: 3, lng: 1 },
      ],
    },
    { isActive: false },
    { sortOrder: -1 },
  ])('invalidates only City lists after a non-Region update', async (payload) => {
    const { invalidate, wrapper } = setup()
    const { result } = renderHook(() => useUpdateCity(1), { wrapper })
    await act(() => result.current.mutateAsync(payload))
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cities', 'list'] })
  })

  it('invalidates City and Region lists after a Region change', async () => {
    const { invalidate, wrapper } = setup()
    const { result } = renderHook(() => useUpdateCity(1), { wrapper })
    await act(() => result.current.mutateAsync({ regionId: 2 }))
    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cities', 'list'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['regions', 'list'] })
  })

  it('does not call the service when Edit has no selected City ID', async () => {
    const update = vi.spyOn(citiesService, 'update')
    const { wrapper } = setup()
    const { result } = renderHook(() => useUpdateCity(null), { wrapper })
    await expect(act(() => result.current.mutateAsync({ nameAr: 'الرياض الجديدة' }))).rejects.toThrow(
      'Cannot update a City without an ID'
    )
    expect(update).not.toHaveBeenCalled()
  })

  it('invalidates City and Region lists after delete', async () => {
    const { invalidate, wrapper } = setup()
    const { result } = renderHook(useDeleteCity, { wrapper })
    await act(() => result.current.mutateAsync(1))
    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cities', 'list'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['regions', 'list'] })
  })
})
