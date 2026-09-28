import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { settingsService } from '@/modules/settings/api/settings.service'
import { settingsKeys } from '@/modules/settings/queries/settings.keys'
import type { Settings } from '@/modules/settings/types/settings.types'
import { useUpdateSettings } from './useUpdateSettings'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const authoritativeSettings: Settings = {
  vatRate: 20,
  freeShippingEnabled: false,
  freeShippingThreshold: null,
  giftWrapEnabled: true,
  giftWrapFee: 15,
  maxAddressesPerUser: 10,
  maxCartItemQuantity: 10,
  otpResendCooldownSeconds: 1,
  guestOrderVerificationMinutes: 30,
  lowStockThreshold: 5,
  returnWindowDays: 14,
}

describe('useUpdateSettings', () => {
  afterEach(() => vi.restoreAllMocks())

  it('writes the authoritative PUT response to only the Settings cache', async () => {
    vi.spyOn(settingsService, 'update').mockResolvedValue(authoritativeSettings)
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(['unrelated'], 'preserved')
    const setQueryData = vi.spyOn(client, 'setQueryData')
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(useUpdateSettings, { wrapper })

    await act(() => result.current.mutateAsync({ vatRate: 20 }))

    expect(settingsService.update).toHaveBeenCalledWith({ vatRate: 20 })
    expect(setQueryData).toHaveBeenCalledWith(settingsKeys.detail(), authoritativeSettings)
    expect(client.getQueryData(settingsKeys.detail())).toEqual(authoritativeSettings)
    expect(client.getQueryData(['unrelated'])).toBe('preserved')
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
