import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'
import type { LoyaltySettings, LoyaltyVersionsPage } from '@/modules/loyalty/types/loyalty.types'
import { useUpdateLoyaltySettings } from './useUpdateLoyaltySettings'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const settings: LoyaltySettings = {
  versionId: 30,
  isEnabled: true,
  amountPerPoint: '11.00',
  redeemPoints: 100,
  redeemAmount: '5.00',
  maxRedeemPercent: 50,
  minRedeemPoints: 100,
  validityMonths: 12,
  expiryWarningDays: 30,
  valuePerPoint: 0.05,
  effectiveReturnPercent: 0.4545,
  launchDate: '2026-11-11T21:23:22+03:00',
  savedAt: '2026-11-13T17:23:02+03:00',
}

describe('useUpdateLoyaltySettings', () => {
  afterEach(() => vi.restoreAllMocks())

  it('writes the authoritative settings response and invalidates only history', async () => {
    vi.spyOn(loyaltyService, 'updateSettings').mockResolvedValue(settings)
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    client.setQueryData(['unrelated'], 'preserved')
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(useUpdateLoyaltySettings, { wrapper })

    await act(() =>
      result.current.mutateAsync({
        versionId: 29,
        isEnabled: true,
        amountPerPoint: 11,
        redeemPoints: 100,
        redeemAmount: 5,
        maxRedeemPercent: 50,
        minRedeemPoints: 100,
        validityMonths: 12,
        expiryWarningDays: 30,
      })
    )

    expect(client.getQueryData(loyaltyKeys.settings())).toEqual(settings)
    expect(client.getQueryData(['unrelated'])).toBe('preserved')
    expect(invalidate).toHaveBeenCalledWith({ queryKey: loyaltyKeys.histories(), refetchType: 'active' })
  })

  it('does not change settings or fabricate history when a save fails', async () => {
    const error = new Error('save failed')
    vi.spyOn(loyaltyService, 'updateSettings').mockRejectedValue(error)
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const existingSettings = { ...settings, versionId: 29 }
    const history: LoyaltyVersionsPage = {
      items: [],
      meta: { current_page: 1, last_page: 1, per_page: 20, total: 0 },
    }
    client.setQueryData(loyaltyKeys.settings(), existingSettings)
    client.setQueryData(loyaltyKeys.history(1, 20), history)
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(useUpdateLoyaltySettings, { wrapper })

    await expect(
      act(() =>
        result.current.mutateAsync({
          versionId: 29,
          isEnabled: true,
          amountPerPoint: 11,
          redeemPoints: 100,
          redeemAmount: 5,
          maxRedeemPercent: 50,
          minRedeemPoints: 100,
          validityMonths: 12,
          expiryWarningDays: 30,
        })
      )
    ).rejects.toBe(error)

    expect(client.getQueryData(loyaltyKeys.settings())).toEqual(existingSettings)
    expect(client.getQueryData(loyaltyKeys.history(1, 20))).toEqual(history)
    expect(invalidate).not.toHaveBeenCalled()
  })
})
