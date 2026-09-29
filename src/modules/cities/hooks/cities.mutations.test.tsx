import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { citiesService } from '@/modules/cities/api/cities.service'
import type { City } from '@/modules/cities/types/city.types'
import { useDeleteCity } from './useDeleteCity'
import { useUpdateCity } from './useUpdateCity'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

const apiError = (message: string) => ({ isAxiosError: true, response: { data: { message } } })

const city: City = {
  id: 1,
  region_id: 1,
  region: { id: 1, name: { ar: 'الرياض', en: 'Riyadh' } },
  name: { ar: 'الرياض', en: 'Riyadh' },
  boundary: null,
  center: null,
  is_active: true,
  sort_order: 1,
  created_at: '2026-09-28T00:00:00Z',
  updated_at: '2026-09-28T00:00:00Z',
}

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { invalidate, wrapper }
}

describe('City mutation cache ownership', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    vi.spyOn(citiesService, 'update').mockResolvedValue({ success: true, message: 'updated', data: city })
    vi.spyOn(citiesService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
  })

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

  it('shows the backend envelope message when delete fails', async () => {
    vi.spyOn(citiesService, 'delete').mockRejectedValueOnce(apiError('This city is still in use.'))
    const { wrapper } = setup()
    const { result } = renderHook(useDeleteCity, { wrapper })

    await expect(act(() => result.current.mutateAsync(1))).rejects.toEqual(apiError('This city is still in use.'))
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('This city is still in use.'))
  })
})
