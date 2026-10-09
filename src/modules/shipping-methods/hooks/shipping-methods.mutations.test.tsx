import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { shippingMethodsService } from '@/modules/shipping-methods/api/shipping-methods.service'
import type { ShippingMethodCreatePayload } from '@/modules/shipping-methods/types/shipping-method.types'
import { useCreateShippingMethod } from './useCreateShippingMethod'
import { useDeleteShippingMethod } from './useDeleteShippingMethod'
import { useUpdateShippingMethod } from './useUpdateShippingMethod'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

const createPayload: ShippingMethodCreatePayload = {
  code: 'standard',
  name: { ar: 'عادي', en: 'Standard' },
  etaLabel: { ar: '٣-٥ أيام عمل', en: '3-5 business days' },
  price: 25,
  isPickup: false,
  isActive: true,
  sortOrder: 1,
}

const apiError = (message: string) => ({ isAxiosError: true, response: { data: { message } } })

function wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('Shipping Method mutation error feedback', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('shows the backend envelope message for Create', async () => {
    const error = apiError('A shipping method with this code already exists.')
    vi.spyOn(shippingMethodsService, 'create').mockRejectedValue(error)
    const { result } = renderHook(useCreateShippingMethod, { wrapper })

    await expect(act(() => result.current.mutateAsync(createPayload))).rejects.toBe(error)
    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('A shipping method with this code already exists.')
    )
  })

  it('shows the backend envelope message for Edit', async () => {
    const error = apiError('The English ETA label is not supported.')
    vi.spyOn(shippingMethodsService, 'update').mockRejectedValue(error)
    const { result } = renderHook(() => useUpdateShippingMethod(1), { wrapper })

    await expect(act(() => result.current.mutateAsync({ etaLabelEn: '4-6 business days' }))).rejects.toBe(error)
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('The English ETA label is not supported.'))
  })

  it('shows the backend envelope message for Delete', async () => {
    const error = apiError('This shipping method is assigned to an order.')
    vi.spyOn(shippingMethodsService, 'delete').mockRejectedValue(error)
    const { result } = renderHook(useDeleteShippingMethod, { wrapper })

    await expect(act(() => result.current.mutateAsync(1))).rejects.toBe(error)
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('This shipping method is assigned to an order.'))
  })

  it('uses the localized fallback for an unsafe non-API error', async () => {
    const error = new Error('Database connection details')
    vi.spyOn(shippingMethodsService, 'delete').mockRejectedValue(error)
    const { result } = renderHook(useDeleteShippingMethod, { wrapper })

    await expect(act(() => result.current.mutateAsync(1))).rejects.toBe(error)
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('Shipping method could not be deleted.'))
  })
})
