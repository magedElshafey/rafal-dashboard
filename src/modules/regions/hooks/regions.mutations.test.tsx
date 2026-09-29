import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { regionsService } from '@/modules/regions/api/regions.service'
import type { Region } from '@/modules/regions/types/region.types'
import { useCreateRegion } from './useCreateRegion'
import { useDeleteRegion } from './useDeleteRegion'
import { useUpdateRegion } from './useUpdateRegion'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

const apiError = (message: string) => ({ isAxiosError: true, response: { data: { message } } })

const region: Region = {
  id: 1,
  name: { ar: 'الرياض', en: 'Riyadh' },
  code: 'RYD',
  is_active: true,
  sort_order: 1,
  cities_count: 0,
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

describe('region mutation cache ownership', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    vi.spyOn(regionsService, 'create').mockResolvedValue({ success: true, message: 'created', data: region })
    vi.spyOn(regionsService, 'update').mockResolvedValue({ success: true, message: 'updated', data: region })
    vi.spyOn(regionsService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
  })

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

  it('shows the backend envelope message when delete fails', async () => {
    vi.spyOn(regionsService, 'delete').mockRejectedValueOnce(apiError('Delete the region cities first.'))
    const { wrapper } = setup()
    const { result } = renderHook(useDeleteRegion, { wrapper })

    await expect(act(() => result.current.mutateAsync(1))).rejects.toEqual(apiError('Delete the region cities first.'))
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('Delete the region cities first.'))
  })
})
