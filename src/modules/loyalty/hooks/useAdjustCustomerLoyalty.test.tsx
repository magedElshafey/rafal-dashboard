import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { useAdjustCustomerLoyalty } from '@/modules/loyalty/hooks/useAdjustCustomerLoyalty'
import { useCustomerLoyaltyLedger } from '@/modules/loyalty/hooks/useCustomerLoyaltyLedger'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'
import type {
  CustomerLoyaltyLedgerPage,
  CustomerLoyaltySummary,
  LoyaltyAdjustmentPayload,
} from '@/modules/loyalty/types/loyalty.types'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const updated: CustomerLoyaltySummary = {
  available: 600,
  pending: 2,
  held: 3,
  expiringSoon: null,
  isBlocked: false,
}

const filters = { type: null, from: '', to: '' } as const
const payload: LoyaltyAdjustmentPayload = {
  type: 'credit',
  points: 500,
  reason: 'other',
  note: 'Customer recovery credit',
  notifyCustomer: false,
}

function ledgerPage(id: number): CustomerLoyaltyLedgerPage {
  return {
    items: [
      {
        id,
        createdAt: '2026-11-14T12:00:00+03:00',
        type: 'adjust_credit',
        label: 'Manual adjustment',
        bucket: 'available',
        points: 500,
        lotExpiresAt: null,
        actorType: 'admin',
        actorName: null,
        reason: 'other',
        reasonLabel: null,
        note: 'Customer recovery credit',
        order: null,
      },
    ],
    meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
  }
}

function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 5 * 60 * 1000, gcTime: Infinity, refetchOnMount: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('customer loyalty adjustment cache lifecycle', () => {
  afterEach(() => vi.restoreAllMocks())

  it('sets only the exact summary and invalidates only that customer ledger scope', async () => {
    vi.spyOn(loyaltyService, 'adjustCustomerPoints').mockResolvedValue(updated)
    const client = createClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    client.setQueryData(loyaltyKeys.customerSummary(13), { ...updated, available: 13 })
    const wrapper = createWrapper(client)
    const { result } = renderHook(() => useAdjustCustomerLoyalty(12), { wrapper })

    await act(() => result.current.mutateAsync(payload))

    expect(loyaltyService.adjustCustomerPoints).toHaveBeenCalledExactlyOnceWith(12, payload)
    expect(client.getQueryData(loyaltyKeys.customerSummary(12))).toEqual(updated)
    expect(client.getQueryData(loyaltyKeys.customerSummary(13))).toEqual({ ...updated, available: 13 })
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({
      queryKey: loyaltyKeys.customerLedgers(12),
      refetchType: 'active',
    })
  })

  it('refreshes one active customer ledger once without touching another customer ledger', async () => {
    vi.spyOn(loyaltyService, 'adjustCustomerPoints').mockResolvedValue(updated)
    const getLedger = vi
      .spyOn(loyaltyService, 'getCustomerLedger')
      .mockImplementation(async (customerId) => ledgerPage(customerId === 12 ? 12 : 13))
    const client = createClient()
    const wrapper = createWrapper(client)
    const customer12 = renderHook(() => useCustomerLoyaltyLedger(12, filters, true), { wrapper })
    const customer13 = renderHook(() => useCustomerLoyaltyLedger(13, filters, true), { wrapper })
    const mutation = renderHook(() => useAdjustCustomerLoyalty(12), { wrapper })

    await waitFor(() => {
      expect(customer12.result.current.isSuccess).toBe(true)
      expect(customer13.result.current.isSuccess).toBe(true)
    })
    await act(() => mutation.result.current.mutateAsync(payload))

    expect(getLedger.mock.calls.filter(([customerId]) => customerId === 12)).toHaveLength(2)
    expect(getLedger.mock.calls.filter(([customerId]) => customerId === 13)).toHaveLength(1)
    expect(customer12.result.current.data).toEqual(ledgerPage(12))
    expect(customer13.result.current.data).toEqual(ledgerPage(13))
  })

  it('marks an inactive ledger stale and refreshes it once when Points reopens', async () => {
    let resolveAdjustment!: (summary: CustomerLoyaltySummary) => void
    vi.spyOn(loyaltyService, 'adjustCustomerPoints').mockImplementation(
      () => new Promise((resolve) => (resolveAdjustment = resolve))
    )
    const getLedger = vi
      .spyOn(loyaltyService, 'getCustomerLedger')
      .mockResolvedValueOnce(ledgerPage(1))
      .mockResolvedValueOnce(ledgerPage(2))
    const client = createClient()
    const wrapper = createWrapper(client)
    const ledger = renderHook(() => useCustomerLoyaltyLedger(12, filters, true), { wrapper })
    const mutation = renderHook(() => useAdjustCustomerLoyalty(12), { wrapper })

    await waitFor(() => expect(ledger.result.current.data).toEqual(ledgerPage(1)))
    let adjustment!: Promise<CustomerLoyaltySummary>
    act(() => {
      adjustment = mutation.result.current.mutateAsync(payload)
    })
    await waitFor(() => expect(loyaltyService.adjustCustomerPoints).toHaveBeenCalledOnce())
    ledger.unmount()
    resolveAdjustment(updated)
    await act(() => adjustment)

    expect(getLedger).toHaveBeenCalledTimes(1)
    expect(client.getQueryState(loyaltyKeys.customerLedger(12, filters))?.isInvalidated).toBe(true)

    const reopened = renderHook(() => useCustomerLoyaltyLedger(12, filters, true), { wrapper })
    await waitFor(() => expect(reopened.result.current.data).toEqual(ledgerPage(2)))
    expect(getLedger).toHaveBeenCalledTimes(2)
    expect(client.getQueryState(loyaltyKeys.customerLedger(12, filters))?.isInvalidated).toBe(false)
  })

  it('does not change cached financial data on failure', async () => {
    const existing = { ...updated, available: 100 }
    vi.spyOn(loyaltyService, 'adjustCustomerPoints').mockRejectedValue(new Error('failed'))
    const client = createClient()
    client.setQueryData(loyaltyKeys.customerSummary(12), existing)
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = createWrapper(client)
    const { result } = renderHook(() => useAdjustCustomerLoyalty(12), { wrapper })

    await expect(
      act(() =>
        result.current.mutateAsync({
          type: 'debit',
          points: 10,
          reason: 'customer_service',
          note: 'Correct customer balance',
          notifyCustomer: false,
        })
      )
    ).rejects.toThrow('failed')

    expect(client.getQueryData(loyaltyKeys.customerSummary(12))).toEqual(existing)
    expect(invalidate).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })
})
