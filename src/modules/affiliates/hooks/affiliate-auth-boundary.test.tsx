import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/store/auth'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import '@/config/i18'
import { queryClient, clearQueryClientAtAuthBoundary } from '@/lib/react-query/query-client'
import { affiliatesService } from '../api/affiliates.service'
import { affiliatesKeys } from '../queries/affiliates.keys'
import { useCreateAffiliate } from './useCreateAffiliate'
import { useUpdateAffiliateSettings } from './useUpdateAffiliateSettings'
import { useUpdateAffiliate } from './useUpdateAffiliate'
import { useAffiliateAction } from './useAffiliateAction'
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }))
vi.mock('sonner', () => ({ toast }))
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)
const settings = {
  programEnabled: true,
  applicationsEnabled: true,
  customerDiscountPercentage: 10,
  affiliateCommissionPercentage: 5,
  minimumPayoutAmount: '0',
  termsPageId: 2,
}
beforeEach(() => {
  clearQueryClientAtAuthBoundary()
  vi.clearAllMocks()
})
afterEach(() => {
  clearQueryClientAtAuthBoundary()
  vi.restoreAllMocks()
})
describe('Affiliate mutation auth/cache boundaries', () => {
  it('removes displayed data when grants change even if view access remains allowed', async () => {
    useAuth.setState({ token: 'grant-session', isAuthenticated: true, effectivePermissions: ['affiliates.view'] })
    queryClient.setQueryData(affiliatesKeys.detail(1), 'old-grant-data')
    const { result } = renderHook(
      () => {
        const allowed = useAuth((state) => state.effectivePermissions?.includes('affiliates.view') === true)
        return useQuery({
          queryKey: affiliatesKeys.detail(1),
          enabled: allowed,
          queryFn: () => new Promise<string>(() => undefined),
        })
      },
      { wrapper }
    )
    expect(result.current.data).toBe('old-grant-data')
    await act(async () =>
      useAuth.getState().setVerifiedPermissions('grant-session', ['affiliates.view', 'affiliates.manage'])
    )
    await waitFor(() => expect(result.current.data).toBeUndefined())
  })
  it('rejects a settings mutation cache write from an obsolete grant snapshot', async () => {
    useAuth.setState({
      token: 'grant-session',
      isAuthenticated: true,
      effectivePermissions: ['affiliates.settings.manage'],
    })
    let finish!: (value: typeof settings) => void
    vi.spyOn(affiliatesService, 'updateSettings').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const { result } = renderHook(() => useUpdateAffiliateSettings(), { wrapper })
    act(() => result.current.mutate(settings))
    await waitFor(() => expect(affiliatesService.updateSettings).toHaveBeenCalledOnce())
    await act(async () => useAuth.getState().setVerifiedPermissions('grant-session', []))
    await act(async () => finish(settings))
    expect(queryClient.getQueryData(affiliatesKeys.settings())).toBeUndefined()
    expect(toast.success).not.toHaveBeenCalled()
  })
  it.each(['profile', 'status'] as const)(
    'keeps unrelated settings reads alive during %s reconciliation',
    async (mode) => {
      let finish!: (value: typeof settings) => void
      let signal!: AbortSignal
      const pending = queryClient.fetchQuery({
        queryKey: affiliatesKeys.settings(),
        queryFn: (context) => {
          signal = context.signal
          return new Promise<typeof settings>((resolve) => {
            finish = resolve
          })
        },
      })
      vi.spyOn(affiliatesService, 'update').mockResolvedValue(undefined)
      vi.spyOn(affiliatesService, 'suspend').mockResolvedValue(undefined)
      const { result } = renderHook(
        () => ({ profile: useUpdateAffiliate(1), status: useAffiliateAction(1, 'suspend') }),
        { wrapper }
      )
      await act(async () => {
        if (mode === 'profile') await result.current.profile.mutateAsync({ name: 'Changed' })
        else await result.current.status.mutateAsync('A valid suspension reason')
      })
      expect(signal.aborted).toBe(false)
      await act(async () => {
        finish(settings)
        await pending
      })
      expect(queryClient.getQueryData(affiliatesKeys.settings())).toEqual(settings)
    }
  )
  it('does not notify or reintroduce user data after logout during creation', async () => {
    let finish!: (v: { affiliate: { id: number }; sms_sent: boolean; sms_message: null }) => void
    vi.spyOn(affiliatesService, 'create').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const { result } = renderHook(() => useCreateAffiliate(), { wrapper })
    act(() =>
      result.current.mutate({
        name: 'Synthetic',
        mobile: '0501112233',
        email: 'a@example.test',
        platform: 'x',
        username: 'test',
        code: '',
      })
    )
    await waitFor(() => expect(affiliatesService.create).toHaveBeenCalledOnce())
    act(() => clearQueryClientAtAuthBoundary())
    await act(async () => finish({ affiliate: { id: 9 }, sms_sent: true, sms_message: null }))
    expect(queryClient.getQueriesData({ queryKey: ['affiliates'] })).toEqual([])
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.warning).not.toHaveBeenCalled()
  })
  it('cancels an older settings read before installing authoritative save data', async () => {
    let finish!: (v: typeof settings) => void
    const pending = queryClient
      .fetchQuery({
        queryKey: affiliatesKeys.settings(),
        queryFn: () =>
          new Promise<typeof settings>((resolve) => {
            finish = resolve
          }),
      })
      .catch(() => undefined)
    const updated = { ...settings, customerDiscountPercentage: 20 }
    vi.spyOn(affiliatesService, 'updateSettings').mockResolvedValue(updated)
    const { result } = renderHook(() => useUpdateAffiliateSettings(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync(updated)
    })
    await act(async () => {
      finish(settings)
      await pending
    })
    expect(queryClient.getQueryData(affiliatesKeys.settings())).toEqual(updated)
  })
  it('suppresses a late settings success after an identity boundary', async () => {
    let finish!: (v: typeof settings) => void
    vi.spyOn(affiliatesService, 'updateSettings').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const { result } = renderHook(() => useUpdateAffiliateSettings(), { wrapper })
    act(() => result.current.mutate(settings))
    await waitFor(() => expect(affiliatesService.updateSettings).toHaveBeenCalledOnce())
    act(() => clearQueryClientAtAuthBoundary())
    await act(async () => finish(settings))
    expect(queryClient.getQueryData(affiliatesKeys.settings())).toBeUndefined()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
