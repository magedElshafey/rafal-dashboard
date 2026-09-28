import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { citiesService } from '@/modules/cities/api/cities.service'
import type { City } from '@/modules/cities/types/city.types'
import { useCreateCity } from './useCreateCity'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useCreateCity cache ownership', () => {
  it('invalidates only City and Region lists', async () => {
    const city: City = {
      id: 1,
      region_id: 1,
      region: { id: 1, name: { ar: 'الرياض', en: 'Riyadh' } },
      name: { ar: 'الدرعية', en: 'Diriyah' },
      is_active: true,
      sort_order: 1,
      boundary: null,
      center: null,
      created_at: '2026-09-28T00:00:00Z',
      updated_at: '2026-09-28T00:00:00Z',
    }
    vi.spyOn(citiesService, 'create').mockResolvedValue({ success: true, message: 'created', data: city })
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(useCreateCity, { wrapper })
    await act(() =>
      result.current.mutateAsync({
        regionId: 1,
        name: { ar: 'الدرعية', en: 'Diriyah' },
        isActive: true,
        sortOrder: null,
        boundary: [
          { lat: 24.6, lng: 46.5 },
          { lat: 24.9, lng: 46.9 },
          { lat: 24.9, lng: 46.5 },
        ],
        center: { lat: 24.75, lng: 46.7 },
      })
    )
    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenNthCalledWith(1, { queryKey: ['cities', 'list'] })
    expect(invalidate).toHaveBeenNthCalledWith(2, { queryKey: ['regions', 'list'] })
  })
})
