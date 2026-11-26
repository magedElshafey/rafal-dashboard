import { beforeEach, describe, expect, it, vi } from 'vitest'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
const gate = vi.hoisted(() => ({ enabled: true, write: true }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('../config/affiliate-feature', () => ({
  get isAffiliateFeatureEnabled() {
    return gate.enabled
  },
  get isAffiliateSettingsWriteReady() {
    return gate.write
  },
}))
import { affiliatesService, normalizeAffiliatePhone } from './affiliates.service'
const raw = {
  id: 1,
  name: 'Synthetic',
  phone: '+966501112233',
  email: 'test@example.test',
  code: 'TEST1',
  status: 'active',
  created_at: '2026-11-20T00:00:00Z',
  source: 'staff',
  orders_count: 2,
  pending: '10.00',
  approved_unpaid: '-0.50',
  paid: '2.00',
}
const settings = {
  enabled: true,
  applications_enabled: true,
  customer_discount_percent: 10,
  commission_percent: 5,
  min_payout: '100.00',
  terms_page_id: 2,
  terms_page: { id: 2 },
}
const values = {
  programEnabled: true,
  applicationsEnabled: true,
  customerDiscountPercentage: 10,
  affiliateCommissionPercentage: 5,
  minimumPayoutAmount: '100.00',
  termsPageId: 2,
}
const create = {
  name: 'Synthetic',
  mobile: '0501112233',
  email: 'test@example.test',
  platform: 'instagram',
  username: 'synthetic',
  code: '',
}
const ok = (data: unknown) => ({ data: { success: true, message: 'ok', data } })
beforeEach(() => {
  vi.resetAllMocks()
  gate.enabled = true
  gate.write = true
})
describe('Laravel Affiliate service (synthetic grants only)', () => {
  it.each([undefined, null, {}, { pending: 45 }, { pending: 'bad' }])(
    'uses unavailable totals for absent/malformed metadata without losing the list: %j',
    async (totals) => {
      http.get.mockResolvedValue({
        data: {
          success: true,
          message: 'ok',
          data: [raw],
          meta: { current_page: 1, last_page: 1, per_page: 25, total: 1, totals },
        },
      })
      const result = await affiliatesService.list(1)
      expect(result.extra).toBeNull()
      expect(result.items).toHaveLength(1)
    }
  )
  it('preserves large and signed decimal totals exactly across filtered pagination', async () => {
    const totals = {
      pending: '-0.01',
      approved_unpaid: '12345678901234567890.01',
      paid_this_month: '400.00',
      open_requests: { count: 2, amount: '350.00' },
    }
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [],
        meta: { current_page: 2, last_page: 2, per_page: 25, total: 30, totals },
      },
    })
    expect((await affiliatesService.list(2, undefined, { search: 'X', status: 'suspended' })).extra).toEqual(totals)
    expect(http.get.mock.calls[0][0].query).toEqual({ page: 2, per_page: 25, search: 'X', status: 'suspended' })
  })
  it('denies unknown access before any transport call, including export and mutations', async () => {
    gate.enabled = false
    await expect(affiliatesService.list(1)).rejects.toThrow()
    await expect(affiliatesService.create(create)).rejects.toThrow()
    await expect(affiliatesService.export({ search: '', status: null })).rejects.toThrow()
    expect(http.get).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
  })
  it('lists server pagination, preserves signed money and totals without profile requirements', async () => {
    http.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [raw],
        meta: {
          current_page: 2,
          last_page: 3,
          per_page: 25,
          total: 60,
          totals: {
            pending: '45.00',
            approved_unpaid: '800.00',
            paid_this_month: '400.00',
            open_requests: { count: 2, amount: '350.00' },
          },
        },
      },
    })
    const signal = new AbortController().signal
    const result = await affiliatesService.list(2, signal, { search: 'name', status: 'active' })
    expect(http.get).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/dashboard/affiliates',
        query: { page: 2, per_page: 25, search: 'name', status: 'active' },
        signal,
        suppressErrorNotification: true,
        suppressSuccessNotification: true,
      })
    )
    expect(result.items[0]).toMatchObject({ approvedUnpaid: '-0.50', ordersCount: 2 })
    expect(result.extra).toEqual({
      pending: '45.00',
      approved_unpaid: '800.00',
      paid_this_month: '400.00',
      open_requests: { count: 2, amount: '350.00' },
    })
    expect(result.paginate.total_pages).toBe(3)
    expect(http.get.mock.calls[0][0]).not.toHaveProperty('headers')
  })
  it.each(['0501112233', '501112233', '966501112233', '00966501112233', '+966501112233'])('normalizes %s', (phone) =>
    expect(normalizeAffiliatePhone(phone)).toBe('+966501112233')
  )
  it('creates with optional code and explicit SMS failure, without retry or fake entity', async () => {
    http.post.mockResolvedValue(ok({ affiliate: { id: 1 }, sms_sent: false, sms_message: 'Could not deliver' }))
    const result = await affiliatesService.create(create)
    expect(result.sms_sent).toBe(false)
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(http.post.mock.calls[0][0].data).toEqual({
      name: create.name,
      phone: '+966501112233',
      email: create.email,
      platform: 'instagram',
      account_handle: 'synthetic',
    })
  })
  it('preserves 422 error identity', async () => {
    const error = { isAxiosError: true, response: { status: 422, data: { errors: { code: ['Collision'] } } } }
    http.post.mockRejectedValue(error)
    await expect(affiliatesService.create(create)).rejects.toBe(error)
  })
  it('reads detail with date parameters and excludes unverified banking data', async () => {
    http.get.mockResolvedValue(ok({ ...raw, platform: 'x', account_handle: 'test', iban: 'SENSITIVE' }))
    const result = await affiliatesService.show(1, undefined, { from: '2026-11-01' })
    expect(result.username).toBe('test')
    expect(result).not.toHaveProperty('iban')
    expect(http.get.mock.calls[0][0].query).toEqual({ from: '2026-11-01' })
  })
  it('rejects a mismatched detail identity', async () => {
    http.get.mockResolvedValue(ok(raw))
    await expect(affiliatesService.show(2)).rejects.toThrow('identity')
  })
  it('uses sparse profile PUT and never expects a full financial result', async () => {
    http.put.mockResolvedValue(ok(null))
    await affiliatesService.update(1, { mobile: '0501112233', username: 'new' })
    expect(http.put.mock.calls[0][0]).toMatchObject({
      url: '/dashboard/affiliates/1',
      data: { phone: '+966501112233', account_handle: 'new' },
    })
  })
  it('sends status reasons and no reset body; parses actual SMS outcome', async () => {
    http.post
      .mockResolvedValueOnce(ok(null))
      .mockResolvedValueOnce(ok(null))
      .mockResolvedValueOnce(ok({ sms_sent: false, sms_message: null }))
    await affiliatesService.suspend(1, 'A valid reason')
    await affiliatesService.reactivate(1, 'Reviewed')
    expect(await affiliatesService.resetPassword(1)).toEqual({ sms_sent: false, sms_message: null })
    expect(http.post.mock.calls[0][0].data).toEqual({ reason: 'A valid reason' })
    expect(http.post.mock.calls[1][0].data).toEqual({ reason: 'Reviewed' })
    expect(http.post.mock.calls[2][0]).not.toHaveProperty('data')
  })
  it.each(['short', 'x'.repeat(251)])('rejects invalid suspend reason', async (reason) => {
    await expect(affiliatesService.suspend(1, reason)).rejects.toThrow()
    expect(http.post).not.toHaveBeenCalled()
  })
  it('maps documented settings and sends all six PUT fields with no version', async () => {
    http.get.mockResolvedValue(ok(settings))
    http.put.mockResolvedValue(ok(settings))
    expect(await affiliatesService.getSettings()).toEqual(values)
    await affiliatesService.updateSettings(values)
    expect(http.put.mock.calls[0][0].data).toEqual({
      enabled: true,
      applications_enabled: true,
      customer_discount_percent: 10,
      commission_percent: 5,
      min_payout: 100,
      terms_page_id: 2,
    })
  })
  it('supports the documented numeric minimum and non-null page case without null/clear semantics', async () => {
    http.get.mockResolvedValue(ok({ ...settings, min_payout: 100 }))
    http.put.mockResolvedValue(ok({ ...settings, min_payout: 0 }))
    expect((await affiliatesService.getSettings()).minimumPayoutAmount).toBe('100')
    expect((await affiliatesService.updateSettings({ ...values, minimumPayoutAmount: '0' })).minimumPayoutAmount).toBe(
      '0'
    )
    expect(http.put.mock.calls[0][0].data).toMatchObject({ min_payout: 0, terms_page_id: 2 })
    expect(Object.keys(http.put.mock.calls[0][0].data)).toHaveLength(6)
  })
  it('keeps unverified settings writes closed and never submits an unset page', async () => {
    gate.write = false
    await expect(affiliatesService.updateSettings(values)).rejects.toThrow()
    gate.write = true
    await expect(affiliatesService.updateSettings({ ...values, termsPageId: null })).rejects.toThrow()
    expect(http.put).not.toHaveBeenCalled()
  })
  it('rejects failure/malformed envelopes', async () => {
    http.get.mockResolvedValue({ data: { success: false, data: [raw] } })
    await expect(affiliatesService.list(1)).rejects.toThrow()
  })
  it('exports only a nonempty CSV through shared transport with matching filters', async () => {
    const blob = new Blob(['code\nTEST'], { type: 'text/csv' })
    http.get.mockResolvedValue({ data: blob, headers: {} })
    await affiliatesService.export({ search: 'test', status: 'active' })
    expect(http.get.mock.calls[0][0]).toMatchObject({
      url: '/dashboard/affiliates/export',
      query: { search: 'test', status: 'active' },
      responseType: 'blob',
    })
    http.get.mockResolvedValue({ data: new Blob(['{}'], { type: 'application/json' }) })
    await expect(affiliatesService.export({ search: '', status: null })).rejects.toThrow('CSV')
  })
})
