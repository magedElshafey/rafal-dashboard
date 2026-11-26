import { clearQueryClientAtAuthBoundary } from '@/lib/react-query/query-client'
import { useAuth } from '@/store/auth'
import { beforeEach, describe, expect, it, vi } from 'vitest'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
const gate = vi.hoisted(() => ({ enabled: true, payout: true, decision: false }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('../config/affiliate-feature', () => ({
  get isAffiliatePayoutDecisionReady() {
    return gate.decision
  },
  get isAffiliateFeatureEnabled() {
    return gate.enabled
  },
  get isAffiliatePayoutFeatureEnabled() {
    return gate.payout
  },
}))
import { affiliateApplicationsService, affiliatePayoutsService } from './affiliate-review.service'
const row = {
  id: 1,
  name: 'Synthetic applicant',
  phone: '+966501112233',
  platform: 'instagram',
  followers_range: 'lt_1k',
  status: 'pending',
  created_at: '2026-11-20',
}
const meta = { current_page: 1, last_page: 2, per_page: 25, total: 30, pending_count: 27 }
const ok = (data: unknown) => ({ data: { success: true, message: 'Done', data } })
let payoutId = 100
beforeEach(() => {
  payoutId += 10
  useAuth.setState({
    isAuthenticated: true,
    token: 'synthetic-staff-token',
    effectivePermissions: [
      'affiliates.view',
      'affiliates.manage',
      'affiliates.settings.manage',
      'affiliates.payouts.process',
    ],
  })
  clearQueryClientAtAuthBoundary()
  vi.resetAllMocks()
  gate.enabled = true
  gate.payout = true
  gate.decision = false
})
describe('Documented review service subsets', () => {
  it.each(['acknowledged', 'timeout', 'malformed', 'conflict'])(
    'never unlocks a %s decision from pending or terminal reads, even across sessions',
    async (outcome) => {
      gate.decision = true
      if (outcome === 'acknowledged') http.post.mockResolvedValue(ok(null))
      else if (outcome === 'malformed') http.post.mockResolvedValue({ data: { success: false } })
      else
        http.post.mockRejectedValue(
          outcome === 'timeout' ? new Error('network') : { isAxiosError: true, response: { status: 409 } }
        )
      await affiliatePayoutsService.reject(payoutId, 'A documented rejection reason').catch(() => undefined)
      for (const status of ['pending', 'paid', 'rejected']) {
        http.get.mockResolvedValue(ok({ payout: { id: payoutId, status }, warning: null }))
        await affiliatePayoutsService.show(payoutId)
        clearQueryClientAtAuthBoundary()
        useAuth.setState({
          token: 'replacement-session',
          isAuthenticated: true,
          effectivePermissions: ['affiliates.payouts.process'],
        })
        await expect(
          affiliatePayoutsService.paid(payoutId, { transfer_reference: 'ABC', transferred_at: '2026-01-01' })
        ).rejects.toThrow('requires reconciliation')
      }
      expect(http.post).toHaveBeenCalledTimes(1)
    }
  )
  it.each(['paid', 'rejected'])(
    'prevents a decision on a fresh %s record without an earlier local mutation',
    async (status) => {
      gate.decision = true
      http.get.mockResolvedValue(ok({ payout: { id: payoutId, status }, warning: null }))
      await affiliatePayoutsService.show(payoutId)
      await expect(affiliatePayoutsService.reject(payoutId, 'A documented rejection reason')).rejects.toThrow(
        'requires reconciliation'
      )
      expect(http.post).not.toHaveBeenCalled()
    }
  )
  it('blocks concurrent calls and does not unlock from a GET started before the mutation', async () => {
    gate.decision = true
    let read!: (value: ReturnType<typeof ok>) => void
    let finish!: (value: ReturnType<typeof ok>) => void
    http.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          read = resolve
        })
    )
    const earlierRead = affiliatePayoutsService.show(payoutId)
    http.post.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    const mutation = affiliatePayoutsService.reject(payoutId, 'A documented rejection reason')
    clearQueryClientAtAuthBoundary()
    useAuth.setState({
      token: 'replacement-during-request',
      isAuthenticated: true,
      effectivePermissions: ['affiliates.payouts.process'],
    })
    await expect(affiliatePayoutsService.reject(payoutId, 'A documented rejection reason')).rejects.toThrow(
      'requires reconciliation'
    )
    finish(ok(null))
    await mutation
    read(ok({ payout: { id: payoutId, status: 'pending' }, warning: null }))
    await earlierRead
    await expect(affiliatePayoutsService.reject(payoutId, 'A documented rejection reason')).rejects.toThrow(
      'requires reconciliation'
    )
    expect(http.post).toHaveBeenCalledTimes(1)
  })
  it('allows a corrected explicit submission after a definite 422 rejection', async () => {
    gate.decision = true
    const error = { isAxiosError: true, response: { status: 422 } }
    http.post.mockRejectedValueOnce(error).mockResolvedValueOnce(ok(null))
    await expect(affiliatePayoutsService.reject(payoutId, 'A documented rejection reason')).rejects.toBe(error)
    await affiliatePayoutsService.reject(payoutId, 'A corrected rejection reason')
    expect(http.post).toHaveBeenCalledTimes(2)
  })
  it('keeps uncertain decisions locked after failed and pending read-back', async () => {
    gate.decision = true
    http.post.mockRejectedValueOnce(new Error('network'))
    await expect(affiliatePayoutsService.reject(payoutId, 'A documented rejection reason')).rejects.toThrow('network')
    await expect(
      affiliatePayoutsService.paid(payoutId, { transfer_reference: 'ABC', transferred_at: '2026-01-01' })
    ).rejects.toThrow('requires reconciliation')
    expect(http.post).toHaveBeenCalledTimes(1)
    http.get.mockRejectedValueOnce(new Error('offline'))
    await expect(affiliatePayoutsService.show(payoutId)).rejects.toThrow('offline')
    await expect(affiliatePayoutsService.reject(payoutId, 'A documented rejection reason')).rejects.toThrow(
      'requires reconciliation'
    )
    http.get.mockResolvedValue(ok({ payout: { id: payoutId, status: 'pending' }, warning: null }))
    await affiliatePayoutsService.show(payoutId)
    http.post.mockResolvedValue(ok(null))
    await expect(affiliatePayoutsService.reject(payoutId, 'A documented rejection reason')).rejects.toThrow(
      'requires reconciliation'
    )
    expect(http.post).toHaveBeenCalledTimes(1)
  })
  it('blocks both financial methods before transport while decision activation is closed', async () => {
    await expect(
      affiliatePayoutsService.paid(1, { transfer_reference: 'BANK-12345', transferred_at: '2026-01-01' })
    ).rejects.toThrow()
    await expect(affiliatePayoutsService.reject(1, 'A documented rejection reason')).rejects.toThrow()
    expect(http.post).not.toHaveBeenCalled()
  })
  it('maps only documented paid/reject fields under a synthetic decision gate, without returning invented balances', async () => {
    gate.decision = true
    http.post.mockResolvedValue(ok(null))
    expect(
      await affiliatePayoutsService.paid(payoutId, { transfer_reference: 'BANK-12345', transferred_at: '2026-01-01' })
    ).toBeUndefined()
    expect(http.post.mock.calls[0][0]).toMatchObject({
      url: `/dashboard/affiliate-payouts/${payoutId}/paid`,
      data: { transfer_reference: 'BANK-12345', transferred_at: '2026-01-01' },
      suppressSuccessNotification: true,
    })
    http.get.mockResolvedValue(
      ok({ payout: { id: payoutId, status: 'pending' }, affiliate_available_balance: '100.00', warning: null })
    )
    await affiliatePayoutsService.show(payoutId)
    await affiliatePayoutsService.reject(payoutId + 1, 'A documented rejection reason')
    expect(http.post.mock.calls[1][0]).toMatchObject({
      url: `/dashboard/affiliate-payouts/${payoutId + 1}/reject`,
      data: { reason: 'A documented rejection reason' },
    })
  })
  it('does not accept a malformed financial acknowledgment or retry a conflict', async () => {
    gate.decision = true
    http.post.mockResolvedValueOnce({ data: { success: false } })
    await expect(affiliatePayoutsService.reject(payoutId, 'A documented rejection reason')).rejects.toThrow()
    http.get.mockResolvedValue(
      ok({ payout: { id: payoutId, status: 'pending' }, affiliate_available_balance: '100.00', warning: null })
    )
    await affiliatePayoutsService.show(payoutId)
    const conflict = { isAxiosError: true, response: { status: 409 } }
    http.post.mockRejectedValueOnce(conflict)
    await expect(affiliatePayoutsService.reject(payoutId + 1, 'A documented rejection reason')).rejects.toBe(conflict)
    expect(http.post).toHaveBeenCalledTimes(2)
  })
  it('keeps application server ordering and authoritative pending count', async () => {
    http.get.mockResolvedValue({ data: { success: true, message: 'ok', data: [{ ...row, id: 2 }, row], meta } })
    const signal = new AbortController().signal
    const result = await affiliateApplicationsService.list(1, signal, 'pending')
    expect(result.items.map((x) => x.id)).toEqual([2, 1])
    expect(result.extra.pendingCount).toBe(27)
    expect(result.paginate.next_page_url).toBe('2')
    expect(http.get.mock.calls[0][0]).toMatchObject({
      url: '/dashboard/affiliate-applications',
      query: { page: 1, status: 'pending' },
      signal,
    })
  })
  it('reads only documented detail fields and decision metadata, not a fabricated timeline', async () => {
    http.get.mockResolvedValue(
      ok({
        ...row,
        customer: {
          id: 7,
          name: 'Customer',
          phone: 'synthetic',
          account_email: null,
          customer_since: '2026-01-01',
          orders_count: 2,
        },
        decided_at: null,
        rejection_reason: null,
        proposed_code: 'CODE1',
        suggested_code_unavailable: true,
        suggested_code_message: 'Choose another code',
        unknown_secret: 'private',
      })
    )
    const result = await affiliateApplicationsService.show(1)
    expect(result.customer.account_email).toBeNull()
    expect(result).not.toHaveProperty('unknown_secret')
    expect(http.get.mock.calls[0][0].url).toBe('/dashboard/affiliate-applications/1')
  })
  it('approves the selected code and preserves SMS false without replay', async () => {
    http.post.mockResolvedValue(ok({ affiliate: { id: 9 }, sms_sent: false, sms_message: null }))
    expect(await affiliateApplicationsService.approve(1, 'CUSTOM')).toMatchObject({
      affiliate: { id: 9 },
      sms_sent: false,
    })
    expect(http.post.mock.calls[0][0].data).toEqual({ code: 'CUSTOM' })
    expect(http.post).toHaveBeenCalledTimes(1)
  })
  it.each([9, 251])('rejects invalid rejection length %s without a request', async (length) => {
    await expect(affiliateApplicationsService.reject(1, 'x'.repeat(length))).rejects.toThrow()
    expect(http.post).not.toHaveBeenCalled()
  })
  it.each([10, 250])('sends rejection length %s', async (length) => {
    http.post.mockResolvedValue(ok(null))
    await affiliateApplicationsService.reject(1, 'x'.repeat(length))
    expect(http.post.mock.calls[0][0].data).toEqual({ reason: 'x'.repeat(length) })
  })
  it('preserves 409 for UI reconciliation without replay', async () => {
    const conflict = { isAxiosError: true, response: { status: 409 } }
    http.post.mockRejectedValue(conflict)
    await expect(affiliateApplicationsService.approve(1, 'CODE1')).rejects.toBe(conflict)
    expect(http.post).toHaveBeenCalledTimes(1)
  })
  it('denies payouts independently from other Affiliate readiness', async () => {
    gate.payout = false
    await expect(affiliatePayoutsService.list(1)).rejects.toThrow()
    await expect(affiliatePayoutsService.show(1)).rejects.toThrow()
    expect(http.get).not.toHaveBeenCalled()
  })
  it('maps protected payout identity/IBAN and balance warning without financial calculations', async () => {
    http.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          message: 'ok',
          data: [
            {
              id: 1,
              status: 'pending',
              affiliate: { id: 2, name: 'Synthetic', code: 'CODE2' },
              iban: 'SYNTHETIC-IBAN',
            },
          ],
          meta,
        },
      })
      .mockResolvedValueOnce(
        ok({
          payout: { id: 1, status: 'pending', unknown: 'ignored' },
          affiliate_available_balance: '-0.50',
          warning: 'Refund changed balance',
        })
      )
    const list = await affiliatePayoutsService.list(1)
    expect(list.items[0].iban).toBe('SYNTHETIC-IBAN')
    const detail = await affiliatePayoutsService.show(1)
    expect(detail.affiliate_available_balance).toBe('-0.50')
    expect(detail.warning).toBe('Refund changed balance')
    expect(detail.payout).not.toHaveProperty('unknown')
    expect(http.post).not.toHaveBeenCalled()
  })
})
