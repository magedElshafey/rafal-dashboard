import { useAuth } from '@/store/auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { affiliateApplicationsService, affiliatePayoutsService } from '../api/affiliate-review.service'
import AffiliateApplicationsPage from './AffiliateApplicationsPage'
import AffiliateApplicationDetailPage from './AffiliateApplicationDetailPage'
import AffiliatePayoutsPage from './AffiliatePayoutsPage'
import AffiliatePayoutDetailPage from './AffiliatePayoutDetailPage'
const state = vi.hoisted(() => ({ enabled: true, payout: true, success: vi.fn(), error: vi.fn(), warning: vi.fn() }))
vi.mock('../config/affiliate-feature', () => ({
  isAffiliatePayoutDecisionReady: false,
  get isAffiliateFeatureEnabled() {
    return state.enabled
  },
  get isAffiliatePayoutFeatureEnabled() {
    return state.payout
  },
}))
vi.mock('sonner', () => ({ toast: state }))
Element.prototype.scrollIntoView = vi.fn()
const row = {
  id: 1,
  name: 'Synthetic applicant',
  phone: '+966501112233',
  platform: 'instagram',
  followers_range: 'lt_1k',
  status: 'pending' as const,
  created_at: '2026-11-20',
}
const detail = {
  ...row,
  customer: {
    id: 8,
    name: 'Synthetic customer',
    phone: 'synthetic',
    account_email: null,
    customer_since: '2026-01-01',
    orders_count: 4,
  },
  proposed_code: 'CODE1',
  suggested_code_message: 'Choose an available code',
  suggested_code_unavailable: true,
}
const paginate = {
  current_page: 1,
  total_pages: 1,
  per_page: 25,
  total: 1,
  count: 1,
  next_page_url: null,
  prev_page_url: null,
}
function mount(
  path = '/apps/1',
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
) {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/apps" element={<AffiliateApplicationsPage />} />
          <Route path="/apps/:id" element={<AffiliateApplicationDetailPage />} />
          <Route path="/payouts" element={<AffiliatePayoutsPage />} />
          <Route path="/payouts/:id" element={<AffiliatePayoutDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return client
}
beforeEach(async () => {
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
  state.enabled = true
  state.payout = true
  state.success.mockReset()
  state.error.mockReset()
  state.warning.mockReset()
  await i18n.changeLanguage('en')
  vi.spyOn(affiliateApplicationsService, 'list').mockResolvedValue({
    items: [row],
    paginate,
    extra: { pendingCount: 19 },
  })
  vi.spyOn(affiliateApplicationsService, 'show').mockResolvedValue(detail)
  vi.spyOn(affiliateApplicationsService, 'approve').mockResolvedValue({
    affiliate: { id: 9 },
    sms_sent: false,
    sms_message: 'SMS unavailable',
  })
  vi.spyOn(affiliateApplicationsService, 'reject').mockResolvedValue('Rejected')
  vi.spyOn(affiliatePayoutsService, 'list').mockResolvedValue({
    items: [
      {
        id: 1,
        status: 'pending',
        affiliate: { id: 9, name: 'Synthetic payee', code: 'CODE9' },
        iban: 'SYNTHETIC-IBAN',
      },
    ],
    paginate,
    extra: null,
  })
  vi.spyOn(affiliatePayoutsService, 'show').mockResolvedValue({
    payout: { id: 1, status: 'pending' },
    affiliate_available_balance: '-0.50',
    warning: 'Refund warning',
  })
})
afterEach(() => vi.restoreAllMocks())
describe('Affiliate application and payout UI', () => {
  it('uses authoritative pending count, responsive list and URL status', async () => {
    mount('/apps?status=pending')
    expect(await screen.findAllByText('Synthetic applicant')).toHaveLength(2)
    expect(screen.getByText('Pending applications: 19')).toBeInTheDocument()
    expect(affiliateApplicationsService.list).toHaveBeenCalledWith(1, expect.any(AbortSignal), 'pending')
    await userEvent.selectOptions(screen.getByRole('combobox'), 'rejected')
    await waitFor(() =>
      expect(affiliateApplicationsService.list).toHaveBeenLastCalledWith(1, expect.any(AbortSignal), 'rejected')
    )
  })
  it('uses shared empty/error/retry states', async () => {
    vi.mocked(affiliateApplicationsService.list)
      .mockRejectedValueOnce(new Error('private'))
      .mockResolvedValue({ items: [], paginate: { ...paginate, total: 0, count: 0 }, extra: { pendingCount: 0 } })
    mount('/apps')
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No applications')).toBeInTheDocument()
    expect(screen.queryByText('private')).not.toBeInTheDocument()
  })
  it('approves the edited code once, shows SMS failure and links the returned Affiliate', async () => {
    const user = userEvent.setup()
    mount()
    expect(await screen.findByText('Synthetic customer')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve application' }))
    const dialog = await screen.findByRole('alertdialog')
    const input = within(dialog).getByRole('textbox', { name: 'Affiliate code' })
    expect(input).toHaveValue('CODE1')
    await user.clear(input)
    await user.type(input, 'EDITED')
    await user.dblClick(within(dialog).getByRole('button', { name: 'Approve application' }))
    await waitFor(() => expect(affiliateApplicationsService.approve).toHaveBeenCalledTimes(1))
    expect(affiliateApplicationsService.approve).toHaveBeenCalledWith(1, 'EDITED')
    expect(await screen.findByRole('link', { name: 'Affiliate details' })).toHaveAttribute(
      'href',
      '/dashboard/affiliates/9'
    )
    expect(state.warning).toHaveBeenCalledWith('SMS unavailable')
  })
  it('rejects with a validated reason and reconciles 409 without replay', async () => {
    vi.mocked(affiliateApplicationsService.reject).mockRejectedValue({
      isAxiosError: true,
      response: { status: 409, data: { message: 'Already decided' } },
    })
    const user = userEvent.setup()
    mount()
    await user.click(await screen.findByRole('button', { name: 'Reject application' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.type(within(dialog).getByRole('textbox', { name: 'Reason' }), 'short')
    await user.click(within(dialog).getByRole('button', { name: 'Reject application' }))
    expect(await screen.findByText('Enter a reason of 10–250 characters.')).toBeInTheDocument()
    expect(affiliateApplicationsService.reject).not.toHaveBeenCalled()
    await user.type(within(dialog).getByRole('textbox', { name: 'Reason' }), ' sufficient reason')
    await user.click(within(dialog).getByRole('button', { name: 'Reject application' }))
    await waitFor(() => expect(affiliateApplicationsService.show).toHaveBeenCalledTimes(2))
    expect(affiliateApplicationsService.reject).toHaveBeenCalledTimes(1)
    expect(state.error).toHaveBeenCalledWith('Already decided')
  })
  it('hides decisions after a terminal result', async () => {
    vi.mocked(affiliateApplicationsService.show).mockResolvedValue({
      ...detail,
      status: 'rejected',
      rejection_reason: 'A valid reason',
      decided_at: '2026-11-26',
    })
    mount()
    expect(await screen.findByText('A valid reason')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve application' })).not.toBeInTheDocument()
  })
  it('shows the payout warning and exact balance with no financial actions', async () => {
    mount('/payouts/1')
    expect(await screen.findByRole('alert')).toHaveTextContent('Refund warning')
    expect(screen.getByText('-0.50 SAR')).toBeInTheDocument()
    expect(screen.getByText('Payout decisions are currently unavailable.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /paid|reject/i })).not.toBeInTheDocument()
  })
  it('keeps full IBAN out of URLs and storage', async () => {
    const before = JSON.stringify(localStorage)
    mount('/payouts')
    expect(await screen.findAllByText('SYNTHETIC-IBAN')).toHaveLength(2)
    expect(JSON.stringify(localStorage)).toBe(before)
    screen.getAllByRole('link').forEach((link) => expect(link.getAttribute('href')).not.toContain('IBAN'))
  })
  it('suppresses payout fetches and cached banking data with unknown access', () => {
    state.payout = false
    const client = new QueryClient()
    client.setQueryData(['affiliates', 'payouts', ''], {
      pages: [{ items: [{ iban: 'SYNTHETIC-IBAN' }], paginate, extra: null }],
      pageParams: [1],
    })
    mount('/payouts', client)
    expect(affiliatePayoutsService.list).not.toHaveBeenCalled()
    expect(screen.queryByText('SYNTHETIC-IBAN')).not.toBeInTheDocument()
  })
  it('suppresses application queries for unknown access', () => {
    state.enabled = false
    mount('/apps')
    expect(affiliateApplicationsService.list).not.toHaveBeenCalled()
  })
  it('supports Arabic/RTL application reading', async () => {
    await i18n.changeLanguage('ar')
    mount('/apps')
    expect(await screen.findAllByText('Synthetic applicant')).toHaveLength(2)
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  })
})
