import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { customersService } from '@/modules/customers/api/customers.service'
import { customersKeys } from '@/modules/customers/queries/customers.keys'
import { useCustomerAccessMutation } from '@/modules/customers/hooks/useCustomerAccessMutation'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('Customer access mutation cache ownership', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each(['block', 'unblock'] as const)('invalidates only lists and the exact detail after %s', async (action) => {
    vi.spyOn(customersService, action).mockResolvedValue()
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(useCustomerAccessMutation, { wrapper })

    await act(() => result.current.mutateAsync({ id: 6, action }))

    expect(invalidateQueries).toHaveBeenCalledTimes(2)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: customersKeys.lists() })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: customersKeys.detail(6), exact: true })
    expect(invalidateQueries).not.toHaveBeenCalledWith(expect.objectContaining({ queryKey: customersKeys.orders(6) }))
  })
})
