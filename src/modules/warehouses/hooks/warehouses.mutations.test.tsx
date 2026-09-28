import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { warehousesKeys } from '@/modules/warehouses/queries/warehouses.keys'
import type { WarehouseResponse } from '@/modules/warehouses/types/warehouse.types'
import { useCreateWarehouse } from './useCreateWarehouse'
import { useDeleteWarehouse } from './useDeleteWarehouse'
import { useUpdateWarehouse } from './useUpdateWarehouse'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const response: WarehouseResponse = {
  success: true,
  message: 'ok',
  data: {
    id: 1,
    name: 'Main',
    cities: [{ id: 17, name: { ar: 'الرياض', en: 'Riyadh' } }],
    isActive: true,
    createdAt: '2026-09-22T17:19:08+00:00',
    updatedAt: '2026-09-22T17:19:08+00:00',
  },
}

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidateQueries = vi.spyOn(client, 'invalidateQueries')
  const setQueryData = vi.spyOn(client, 'setQueryData')
  const removeQueries = vi.spyOn(client, 'removeQueries')
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, invalidateQueries, setQueryData, removeQueries, wrapper }
}

describe('Warehouse mutation cache ownership', () => {
  afterEach(() => vi.restoreAllMocks())

  it('Create seeds its detail and invalidates only Warehouse lists', async () => {
    vi.spyOn(warehousesService, 'create').mockResolvedValue(response)
    const { invalidateQueries, setQueryData, wrapper } = setup()
    const { result } = renderHook(useCreateWarehouse, { wrapper })

    await act(() => result.current.mutateAsync({ name: 'Main', cityIds: [17], isActive: true }))

    expect(setQueryData).toHaveBeenCalledWith(warehousesKeys.detail(1), response)
    expect(invalidateQueries).toHaveBeenCalledTimes(1)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: warehousesKeys.lists() })
  })

  it('Update replaces its detail and invalidates only Warehouse lists', async () => {
    vi.spyOn(warehousesService, 'update').mockResolvedValue(response)
    const { invalidateQueries, setQueryData, wrapper } = setup()
    const { result } = renderHook(() => useUpdateWarehouse(1), { wrapper })

    await act(() => result.current.mutateAsync({ name: 'Main' }))

    expect(setQueryData).toHaveBeenCalledWith(warehousesKeys.detail(1), response)
    expect(invalidateQueries).toHaveBeenCalledTimes(1)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: warehousesKeys.lists() })
  })

  it('Delete removes its detail and invalidates only Warehouse lists', async () => {
    vi.spyOn(warehousesService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
    const { invalidateQueries, removeQueries, wrapper } = setup()
    const { result } = renderHook(useDeleteWarehouse, { wrapper })

    await act(() => result.current.mutateAsync(1))

    expect(removeQueries).toHaveBeenCalledWith({ queryKey: warehousesKeys.detail(1), exact: true })
    expect(invalidateQueries).toHaveBeenCalledTimes(1)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: warehousesKeys.lists() })
  })
})
