import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { customersService } from '@/modules/customers/api/customers.service'
import CustomerDetailPage from '@/modules/customers/pages/CustomerDetailPage'
import type { CustomerDetail, CustomerOrderListItem } from '@/modules/customers/types/customer.types'
import { loyaltyService } from '@/modules/loyalty/api/loyalty.service'
import { loyaltyKeys } from '@/modules/loyalty/queries/loyalty.keys'
import type { CustomerLoyaltyLedgerItem, CustomerLoyaltySummary } from '@/modules/loyalty/types/loyalty.types'
import customerAr from '@/modules/customers/locale/ar.json'
import loyaltyAr from '@/modules/loyalty/locale/ar.json'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
HTMLElement.prototype.setPointerCapture = vi.fn()
HTMLElement.prototype.releasePointerCapture = vi.fn()
Element.prototype.scrollIntoView = vi.fn()

const customer = (id = 12): CustomerDetail => ({
  id,
  name: `Customer ${id}`,
  email: `customer-${id}@example.com`,
  phone: null,
  firstName: 'Customer',
  lastName: String(id),
  termsAcceptedAt: null,
  marketingOptIn: false,
  status: 'active',
  isBlocked: false,
  blockedAt: null,
  blockedReason: null,
  addressesCount: 0,
  createdAt: '2026-09-20T19:55:28+00:00',
  updatedAt: '2026-09-20T19:55:28+00:00',
})

const summary: CustomerLoyaltySummary = {
  available: 0,
  pending: 0,
  held: 0,
  expiringSoon: null,
  isBlocked: true,
}

const ledgerItem: CustomerLoyaltyLedgerItem = {
  id: 116,
  createdAt: '2026-11-13T17:25:44+03:00',
  type: 'adjust_credit',
  label: 'Manual adjustment',
  bucket: 'available',
  points: 5000,
  lotExpiresAt: null,
  actorType: 'admin',
  actorName: null,
  reason: null,
  reasonLabel: null,
  note: 'Internal loyalty note',
  order: null,
}

function ordersPage(): PaginatedData<CustomerOrderListItem> {
  return {
    items: [],
    paginate: {
      current_page: 1,
      total_pages: 1,
      per_page: 15,
      total: 0,
      count: 0,
      next_page_url: null,
      prev_page_url: null,
    },
    extra: null,
  }
}

function NavigationControls() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output data-testid="location">{`${location.pathname}${location.search}`}</output>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Forward
      </button>
      <button type="button" onClick={() => navigate('/dashboard/customers/13?tab=points')}>
        Customer 13
      </button>
    </>
  )
}

function renderPage(entry = '/dashboard/customers/12') {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 5 * 60 * 1000, gcTime: Infinity, refetchOnMount: false },
      mutations: { retry: false },
    },
  })
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route
              path="/dashboard/customers/:id"
              element={
                <>
                  <CustomerDetailPage />
                  <NavigationControls />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  }
}

describe('Customer loyalty page', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    await i18n.changeLanguage('en')
    vi.spyOn(customersService, 'show').mockImplementation(async (id) => customer(id))
    vi.spyOn(customersService, 'orders').mockResolvedValue(ordersPage())
    vi.spyOn(loyaltyService, 'getCustomerSummary').mockResolvedValue(summary)
    vi.spyOn(loyaltyService, 'getCustomerLedger').mockResolvedValue({
      items: [ledgerItem],
      meta: { current_page: 1, last_page: 1, per_page: 50, total: 1 },
    })
    vi.spyOn(loyaltyService, 'adjustCustomerPoints').mockResolvedValue({ ...summary, available: 50 })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('keeps Overview behavior and performs no loyalty requests', async () => {
    renderPage()

    expect(await screen.findByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('No orders yet')).toBeInTheDocument()
    expect(customersService.show).toHaveBeenCalledOnce()
    expect(customersService.orders).toHaveBeenCalledOnce()
    expect(loyaltyService.getCustomerSummary).not.toHaveBeenCalled()
    expect(loyaltyService.getCustomerLedger).not.toHaveBeenCalled()
  })

  it('falls back to Overview for an invalid tab value', async () => {
    renderPage('/dashboard/customers/12?tab=invalid')

    expect(await screen.findByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(customersService.orders).toHaveBeenCalledOnce()
    expect(loyaltyService.getCustomerSummary).not.toHaveBeenCalled()
    expect(loyaltyService.getCustomerLedger).not.toHaveBeenCalled()
  })

  it('opens Points directly without Orders and renders zero, frozen, and nullable ledger values', async () => {
    renderPage('/dashboard/customers/12?tab=points')

    expect(await screen.findByRole('tab', { name: 'Points' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('Frozen')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3)
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0)
    expect(await screen.findByRole('table', { name: 'Points ledger' })).toBeInTheDocument()
    expect(screen.getAllByText('+5,000')).not.toHaveLength(0)
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /edit|delete/i })).not.toBeInTheDocument()
    expect(customersService.orders).not.toHaveBeenCalled()
    expect(loyaltyService.getCustomerSummary).toHaveBeenCalledExactlyOnceWith(12, expect.any(AbortSignal))
    expect(loyaltyService.getCustomerLedger).toHaveBeenCalledExactlyOnceWith(
      12,
      { type: null, from: '', to: '' },
      expect.any(AbortSignal)
    )
  })

  it('uses URL filters, avoids incomplete date requests, and preserves the Points tab', async () => {
    renderPage('/dashboard/customers/12?tab=points&type=adjust_credit&from=2026-11-01&to=2026-11-30&page=4')

    await waitFor(() =>
      expect(loyaltyService.getCustomerLedger).toHaveBeenCalledWith(
        12,
        { type: 'adjust_credit', from: '2026-11-01', to: '2026-11-30' },
        expect.any(AbortSignal)
      )
    )
    expect(screen.getByTestId('location')).toHaveTextContent(
      'tab=points&type=adjust_credit&from=2026-11-01&to=2026-11-30'
    )
  })

  it('clears supported filters while preserving the Points tab', async () => {
    const user = userEvent.setup()
    renderPage('/dashboard/customers/12?tab=points&type=adjust_credit&from=2026-11-01&to=2026-11-30&page=4')
    await screen.findByRole('table', { name: 'Points ledger' })

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/customers/12?tab=points'))
    await waitFor(() =>
      expect(loyaltyService.getCustomerLedger).toHaveBeenLastCalledWith(
        12,
        { type: null, from: '', to: '' },
        expect.any(AbortSignal)
      )
    )
  })

  it('does not request the ledger for an incomplete date range', async () => {
    renderPage('/dashboard/customers/12?tab=points&from=2026-11-01')

    expect(await screen.findByText('Complete the date range')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Select both')
    expect(loyaltyService.getCustomerLedger).not.toHaveBeenCalled()
    expect(loyaltyService.getCustomerSummary).toHaveBeenCalledOnce()
  })

  it('supports Back/Forward without duplicate reads and isolates customer-scoped caches', async () => {
    const user = userEvent.setup()
    const { client } = renderPage()
    await screen.findByRole('tab', { name: 'Overview' })

    await user.click(screen.getByRole('tab', { name: 'Points' }))
    await screen.findByRole('table', { name: 'Points ledger' })
    await user.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true'))
    await user.click(screen.getByRole('button', { name: 'Forward' }))
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Points' })).toHaveAttribute('aria-selected', 'true'))
    expect(loyaltyService.getCustomerSummary).toHaveBeenCalledTimes(1)
    expect(loyaltyService.getCustomerLedger).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Customer 13' }))
    await waitFor(() => expect(loyaltyService.getCustomerSummary).toHaveBeenCalledWith(13, expect.any(AbortSignal)))
    expect(client.getQueryData(loyaltyKeys.customerSummary(12))).toEqual(summary)
    expect(client.getQueryData(loyaltyKeys.customerSummary(13))).toEqual(summary)
  })

  it('keeps a successful ledger visible when the summary fails', async () => {
    vi.mocked(loyaltyService.getCustomerSummary).mockRejectedValue(new Error('summary failed'))
    renderPage('/dashboard/customers/12?tab=points')

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(await screen.findByRole('table', { name: 'Points ledger' })).toBeInTheDocument()
    expect(screen.queryByText('summary failed')).not.toBeInTheDocument()
  })

  it('keeps the summary visible when the independent ledger request fails', async () => {
    vi.mocked(loyaltyService.getCustomerLedger).mockRejectedValue(new Error('ledger failed'))
    renderPage('/dashboard/customers/12?tab=points')

    expect(await screen.findByText('Frozen')).toBeInTheDocument()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('ledger failed')).not.toBeInTheDocument()
  })

  it('renders an empty filtered ledger state', async () => {
    vi.mocked(loyaltyService.getCustomerLedger).mockResolvedValue({
      items: [],
      meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 },
    })
    renderPage('/dashboard/customers/12?tab=points')

    expect(await screen.findByText('No ledger transactions')).toBeInTheDocument()
    expect(screen.getByText('No transactions match the current filters.')).toBeInTheDocument()
  })

  it('opens, validates, and closes the accessible adjustment dialog with notification off by default', async () => {
    const user = userEvent.setup()
    renderPage('/dashboard/customers/12?tab=points')
    const trigger = await screen.findByRole('button', { name: 'Adjust points' })

    await user.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Adjust loyalty points' })
    expect(dialog).toHaveAttribute('dir', 'ltr')
    expect(dialog.classList.contains('max-h-[calc(100dvh-2rem)]')).toBe(true)
    expect(dialog.classList.contains('overflow-y-auto')).toBe(true)
    expect(screen.getByRole('radio', { name: 'Credit' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Request customer notification' })).not.toBeChecked()
    expect(screen.getByText(/This customer is frozen/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Apply adjustment' }))
    expect(await screen.findAllByText('This field is required.')).not.toHaveLength(0)
    expect(loyaltyService.adjustCustomerPoints).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('submits a credit once, preserves URL filters, updates summary cache, and refreshes the active ledger', async () => {
    const user = userEvent.setup()
    const updated = { ...summary, available: 5000 }
    vi.mocked(loyaltyService.adjustCustomerPoints).mockResolvedValue(updated)
    const { client } = renderPage('/dashboard/customers/12?tab=points&type=adjust_credit')
    await user.click(await screen.findByRole('button', { name: 'Adjust points' }))

    await user.type(screen.getByRole('spinbutton', { name: 'Points' }), '5000')
    await user.click(screen.getByRole('combobox', { name: 'Reason' }))
    await user.click(await screen.findByRole('option', { name: 'Customer service' }))
    await user.type(screen.getByRole('textbox', { name: 'Internal note' }), 'Test credit for loyalty QA')
    await user.click(screen.getByRole('button', { name: 'Apply adjustment' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(loyaltyService.adjustCustomerPoints).toHaveBeenCalledExactlyOnceWith(12, {
      type: 'credit',
      points: 5000,
      reason: 'customer_service',
      note: 'Test credit for loyalty QA',
      notifyCustomer: false,
    })
    expect(client.getQueryData(loyaltyKeys.customerSummary(12))).toEqual(updated)
    expect(screen.getByTestId('location')).toHaveTextContent('tab=points&type=adjust_credit')
    await waitFor(() => expect(loyaltyService.getCustomerLedger).toHaveBeenCalledTimes(2))
  })

  it('submits a supported debit and includes an explicitly requested notification', async () => {
    const user = userEvent.setup()
    vi.mocked(loyaltyService.getCustomerSummary).mockResolvedValue({ ...summary, available: 100, isBlocked: false })
    renderPage('/dashboard/customers/12?tab=points')
    await user.click(await screen.findByRole('button', { name: 'Adjust points' }))
    await user.click(screen.getByRole('radio', { name: 'Debit' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Points' }), '25')
    await user.click(screen.getByRole('combobox', { name: 'Reason' }))
    await user.click(await screen.findByRole('option', { name: 'Other' }))
    await user.type(screen.getByRole('textbox', { name: 'Internal note' }), 'Correct customer balance')
    await user.click(screen.getByRole('checkbox', { name: 'Request customer notification' }))
    await user.click(screen.getByRole('button', { name: 'Apply adjustment' }))

    await waitFor(() =>
      expect(loyaltyService.adjustCustomerPoints).toHaveBeenCalledExactlyOnceWith(12, {
        type: 'debit',
        points: 25,
        reason: 'other',
        note: 'Correct customer balance',
        notifyCustomer: true,
      })
    )
  })

  it('rejects an over-balance debit locally without changing the authoritative summary', async () => {
    const user = userEvent.setup()
    const available = { ...summary, available: 20, isBlocked: false }
    vi.mocked(loyaltyService.getCustomerSummary).mockResolvedValue(available)
    const { client } = renderPage('/dashboard/customers/12?tab=points')
    await user.click(await screen.findByRole('button', { name: 'Adjust points' }))
    await user.click(screen.getByRole('radio', { name: 'Debit' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Points' }), '21')
    await user.click(screen.getByRole('combobox', { name: 'Reason' }))
    await user.click(await screen.findByRole('option', { name: 'Other' }))
    await user.type(screen.getByRole('textbox', { name: 'Internal note' }), 'Correct customer balance')
    await user.click(screen.getByRole('button', { name: 'Apply adjustment' }))

    expect(await screen.findByText(/Debit cannot exceed the available balance of 20 points/)).toBeInTheDocument()
    expect(loyaltyService.adjustCustomerPoints).not.toHaveBeenCalled()
    expect(client.getQueryData(loyaltyKeys.customerSummary(12))).toEqual(available)
  })

  it('preserves form input and cache after Laravel validation or network failure', async () => {
    const user = userEvent.setup()
    const existing = { ...summary, available: 100, isBlocked: false }
    vi.mocked(loyaltyService.getCustomerSummary).mockResolvedValue(existing)
    vi.mocked(loyaltyService.adjustCustomerPoints).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 422, data: { errors: { points: ['Insufficient balance'] } } },
    })
    const { client } = renderPage('/dashboard/customers/12?tab=points')
    await user.click(await screen.findByRole('button', { name: 'Adjust points' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Points' }), '25')
    await user.click(screen.getByRole('combobox', { name: 'Reason' }))
    await user.click(await screen.findByRole('option', { name: 'Other' }))
    const note = screen.getByRole('textbox', { name: 'Internal note' })
    await user.type(note, 'Correct customer balance')
    await user.click(screen.getByRole('button', { name: 'Apply adjustment' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Loyalty points could not be adjusted')
    expect(screen.getByRole('spinbutton', { name: 'Points' })).toHaveValue(25)
    expect(note).toHaveValue('Correct customer balance')
    expect(client.getQueryData(loyaltyKeys.customerSummary(12))).toEqual(existing)

    vi.mocked(loyaltyService.adjustCustomerPoints).mockRejectedValueOnce(new Error('offline'))
    await user.click(screen.getByRole('button', { name: 'Apply adjustment' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Loyalty points could not be adjusted')
    expect(note).toHaveValue('Correct customer balance')
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('prevents duplicate submissions while an adjustment is pending', async () => {
    const user = userEvent.setup()
    let resolveAdjustment!: (value: CustomerLoyaltySummary) => void
    vi.mocked(loyaltyService.adjustCustomerPoints).mockImplementation(
      () => new Promise((resolve) => (resolveAdjustment = resolve))
    )
    renderPage('/dashboard/customers/12?tab=points')
    await user.click(await screen.findByRole('button', { name: 'Adjust points' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Points' }), '10')
    await user.click(screen.getByRole('combobox', { name: 'Reason' }))
    await user.click(await screen.findByRole('option', { name: 'Other' }))
    await user.type(screen.getByRole('textbox', { name: 'Internal note' }), 'Correct customer balance')
    const submit = screen.getByRole('button', { name: 'Apply adjustment' })
    await user.dblClick(submit)

    expect(loyaltyService.adjustCustomerPoints).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Applying…' })).toBeDisabled()
    resolveAdjustment({ ...summary, available: 10 })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('uses Arabic RTL labels, localized points, and expiry dates', async () => {
    await i18n.changeLanguage('ar')
    vi.mocked(loyaltyService.getCustomerSummary).mockResolvedValue({
      available: 5127,
      pending: 0,
      held: 0,
      expiringSoon: { points: 100, expiresAt: '2026-11-21T21:29:08+03:00' },
      isBlocked: true,
    })
    renderPage('/dashboard/customers/12?tab=points')

    expect(await screen.findByRole('tab', { name: customerAr.customers.detail.tabs.points })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(await screen.findByText(loyaltyAr.loyalty.customer.summary.frozen)).toBeInTheDocument()
    expect(screen.getAllByText('٥٬١٢٧')).not.toHaveLength(0)
    expect(screen.getByText(/تنتهي في/)).toBeInTheDocument()
    expect(screen.getAllByText('+٥٬٠٠٠').every((element) => element.closest('bdi')?.dir === 'ltr')).toBe(true)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: loyaltyAr.loyalty.customer.adjustment.action }))
    expect(screen.getByRole('dialog')).toHaveAttribute('dir', 'rtl')
  })
})
