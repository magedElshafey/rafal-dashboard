import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { formatDateTime } from '@/utils/date/date.helpers'
import { customersService, normalizeCustomerDetail } from '../api/customers.service'
import { customersKeys } from '../queries/customers.keys'
import { emptyCustomersFilters } from '../utils/customer-filters'
import type { RawCustomerDetail, RawCustomerOrderListItem } from '../types/customer.types'
import CustomerDetailPage from './CustomerDetailPage'
import en from '../locale/en.json'
import ar from '../locale/ar.json'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast }))

const customer: RawCustomerDetail = {
  id: 12,
  name: 'API Test User',
  email: 'api-test@test.test',
  phone: '0505555555',
  first_name: 'API',
  last_name: 'Test',
  terms_accepted_at: null,
  marketing_opt_in: false,
  status: 'active',
  is_blocked: false,
  blocked_at: null,
  blocked_reason: null,
  addresses_count: 0,
  created_at: '2026-09-20T19:55:28+00:00',
  updated_at: '2026-09-20T19:55:28+00:00',
}
const order: RawCustomerOrderListItem = {
  id: 64,
  order_number: 'RF-10064',
  display_number: '#RF-10064',
  status: 'cancelled',
  customer: { type: 'registered', name: null, email: null, phone: null },
  items_count: 0,
  total: '277.50',
  currency: 'SAR',
  payment_status: 'paid',
  is_gift: true,
  placed_at: '2026-09-19T20:22:24+00:00',
}
const detailReply = (data = customer) => ({ data: { success: true, message: 'ok', data } })
const ordersReply = (items = [order], page = 1, last = 1, total = items.length) => ({
  data: {
    success: true,
    message: 'ok',
    data: items,
    meta: { current_page: page, last_page: last, per_page: 15, total },
  },
})
function renderPage(id = '12', client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })) {
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/dashboard/customers/${id}`]}>
        <Routes>
          <Route path="/dashboard/customers/:id" element={<CustomerDetailPage />} />
          <Route path="/dashboard/customers" element={<p>Customers destination</p>} />
          <Route path="/dashboard/orders/:id" element={<p>Order destination</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...result, client }
}
const profile = () => screen.findByRole('heading', { level: 1, name: customer.name ?? '' })

beforeEach(async () => {
  vi.clearAllMocks()
  http.get
    .mockReset()
    .mockImplementation(async ({ url }: { url: string }) => (url.endsWith('/orders') ? ordersReply() : detailReply()))
  http.post.mockReset().mockResolvedValue({ data: { success: true } })
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  await i18n.changeLanguage('en')
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Customer 360', () => {
  it('uses two parallel canonical reads, no enrichment, and accessible operational sections', async () => {
    const show = vi.spyOn(customersService, 'show')
    const orders = vi.spyOn(customersService, 'orders')
    const { client, container } = renderPage()
    await profile()
    await screen.findByRole('table', { name: 'Order history' })
    expect(show).toHaveBeenCalledExactlyOnceWith(12, expect.any(AbortSignal))
    expect(orders).toHaveBeenCalledExactlyOnceWith(12, 1, expect.any(AbortSignal))
    expect(http.get.mock.calls.map(([request]) => request.url).sort()).toEqual([
      '/dashboard/customers/12',
      '/dashboard/customers/12/orders',
    ])
    expect(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey)
    ).toEqual([customersKeys.detail(12), customersKeys.ordersList(12)])
    expect(client.getQueryData(customersKeys.detail(12))).toEqual(normalizeCustomerDetail(customer))
    const identity = within(screen.getByRole('region', { name: 'Identity' }))
    for (const value of ['API', 'Test', 'api-test@test.test', '0505555555', '12'])
      expect(identity.getByText(value)).toBeInTheDocument()
    const account = within(screen.getByRole('region', { name: 'Account' }))
    for (const value of ['Active', 'No', '0', '—']) expect(account.getByText(value)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Access status' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Metadata' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('link', { name: 'View order #RF-10064' })).toHaveLength(2)
    expect(screen.getAllByText('277.50 SAR')).toHaveLength(2)
    expect(screen.getAllByText('Paid')).toHaveLength(2)
    expect(screen.getAllByText('Cancelled')).toHaveLength(2)
    expect(screen.getByText('1 order')).toBeInTheDocument()
    expect(screen.queryByText('Lifetime spend')).not.toBeInTheDocument()
    expect(container.querySelector('input,textarea')).toBeNull()
    const ids = Array.from(container.querySelectorAll('[id]')).map((node) => node.id)
    expect(new Set(ids).size).toBe(ids.length)
    await userEvent.click(screen.getAllByRole('link', { name: 'View order #RF-10064' })[0])
    expect(screen.getByText('Order destination')).toBeInTheDocument()
  })

  it.each(['0', '-1', 'abc', '1.5', '1e2', '9007199254740992'])('rejects %s without mounting queries', (id) => {
    const { client } = renderPage(id)
    expect(screen.getByRole('heading', { name: 'Customer not found' })).toBeInTheDocument()
    expect(http.get).not.toHaveBeenCalled()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it('starts both reads before either resolves, and aborts both on unmount', () => {
    http.get.mockImplementation(() => new Promise(() => {}))
    const { unmount } = renderPage()
    expect(http.get).toHaveBeenCalledTimes(2)
    const signals: AbortSignal[] = http.get.mock.calls.map(([request]) => request.signal)
    expect(signals.every((signal) => !signal.aborted)).toBe(true)
    unmount()
    expect(signals.every((signal) => signal.aborted)).toBe(true)
  })

  it('keeps Orders mounted across core readiness and displays cached core data immediately', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    client.setQueryData(customersKeys.detail(12), normalizeCustomerDetail(customer))
    http.get.mockImplementation(({ url }: { url: string }) =>
      url.endsWith('/orders') ? Promise.resolve(ordersReply()) : new Promise(() => {})
    )
    renderPage('12', client)
    expect(screen.getByRole('heading', { name: 'API Test User' })).toBeInTheDocument()
    await screen.findByRole('table', { name: 'Order history' })
    expect(http.get).toHaveBeenCalledTimes(2)
  })

  it('keeps loaded profile visible while Orders remains loading', async () => {
    http.get.mockImplementation(({ url }: { url: string }) =>
      url.endsWith('/orders') ? new Promise(() => {}) : Promise.resolve(detailReply())
    )
    renderPage()
    await profile()
    expect(
      within(screen.getByRole('region', { name: 'Order history' })).getByTestId('query-loading-state')
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Identity' })).queryByTestId('query-loading-state')
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Block' })).toBeEnabled()
  })

  it('mirrors section order, cards, facts and Orders table in the loading layout', async () => {
    let resolveShow!: (value: unknown) => void
    let resolveOrders!: (value: unknown) => void
    http.get.mockImplementation(
      ({ url }: { url: string }) =>
        new Promise((resolve) => {
          if (url.endsWith('/orders')) resolveOrders = resolve
          else resolveShow = resolve
        })
    )
    const { container } = renderPage()
    const structure = () =>
      Array.from(container.querySelectorAll('section')).map((section) => ({
        title: section.querySelector('h2')?.textContent,
        card: section.firstElementChild?.className,
        labels: Array.from(section.querySelectorAll('dt')).map((node) => node.textContent),
      }))
    const before = structure()
    const columns = Array.from(container.querySelectorAll('th')).map((node) => node.textContent)
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(30)
    expect(container.querySelector('button,a,input')).toBeNull()
    await act(async () => {
      resolveShow(detailReply())
      resolveOrders(ordersReply())
    })
    await profile()
    await screen.findByRole('table', { name: 'Order history' })
    expect(structure().filter((item) => item.title !== 'Order history')).toEqual(
      before.filter((item) => item.title !== 'Order history')
    )
    expect(structure().map(({ title, card }) => ({ title, card }))).toEqual(
      before.map(({ title, card }) => ({ title, card }))
    )
    expect(Array.from(container.querySelectorAll('th')).map((node) => node.textContent)).toEqual(columns)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull()
    expect(http.get).toHaveBeenCalledTimes(2)
  })

  it.each([
    [{ name: ' Preferred ' }, 'Preferred'],
    [{ name: ' ' }, 'API Test'],
    [{ name: null, first_name: null, last_name: null }, 'api-test@test.test'],
    [{ name: null, first_name: null, last_name: null, email: null }, '0505555555'],
    [{ name: null, first_name: null, last_name: null, email: null, phone: null }, 'Customer Details'],
  ])('applies display-name fallback without a blank heading', async (overrides, expected) => {
    http.get.mockImplementation(async ({ url }: { url: string }) =>
      url.endsWith('/orders') ? ordersReply([]) : detailReply({ ...customer, ...overrides })
    )
    renderPage()
    expect(await screen.findByRole('heading', { name: expected, level: 1 })).toBeInTheDocument()
  })

  it('preserves backend totals, uses meta.total rather than loaded count, and paginates only on demand', async () => {
    http.get.mockImplementation(async ({ url, query }: { url: string; query?: { page: number } }) => {
      if (!url.endsWith('/orders')) return detailReply()
      return query?.page === 2
        ? ordersReply([{ ...order, id: 65, display_number: '#RF-10065', placed_at: null, is_gift: false }], 2, 2, 37)
        : ordersReply([{ ...order, total: '999999999999999999.123', currency: 'USD' }], 1, 2, 37)
    })
    renderPage()
    await profile()
    expect(await screen.findByText('37 orders')).toBeInTheDocument()
    expect(screen.getAllByText('999,999,999,999,999,999.123 USD')).toHaveLength(2)
    expect(http.get).toHaveBeenCalledTimes(2)
    await userEvent.click(screen.getByRole('button', { name: 'Load more orders' }))
    await screen.findAllByText('#RF-10065')
    expect(http.get).toHaveBeenLastCalledWith(
      expect.objectContaining({ url: '/dashboard/customers/12/orders', query: { page: 2 } })
    )
    expect(screen.getByText('37 orders')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more orders' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /View order/ })).toHaveLength(4)
  })

  it('contains an initial Orders failure and retries only the Orders request', async () => {
    let attempts = 0
    http.get.mockImplementation(async ({ url }: { url: string }) => {
      if (!url.endsWith('/orders')) return detailReply()
      if (++attempts === 1) throw new Error('private order failure')
      return ordersReply([])
    })
    renderPage()
    await profile()
    const section = within(screen.getByRole('region', { name: 'Order history' }))
    expect(await section.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('private order failure')).not.toBeInTheDocument()
    await userEvent.click(section.getByRole('button', { name: 'Try again' }))
    expect(await section.findByText('No orders yet')).toBeInTheDocument()
    expect(screen.getByText('0 orders')).toBeInTheDocument()
    expect(http.get.mock.calls.filter(([request]) => request.url === '/dashboard/customers/12')).toHaveLength(1)
  })

  it('preserves prior orders after a later-page failure without automatic retry loops', async () => {
    let secondPageCalls = 0
    http.get.mockImplementation(async ({ url, query }: { url: string; query?: { page: number } }) => {
      if (!url.endsWith('/orders')) return detailReply()
      if (query?.page === 2) {
        if (++secondPageCalls === 1) throw new Error('private pagination failure')
        return ordersReply([{ ...order, id: 65, display_number: '#RF-10065' }], 2, 2, 2)
      }
      return ordersReply([order], 1, 2, 2)
    })
    renderPage()
    await profile()
    await userEvent.click(await screen.findByRole('button', { name: 'Load more orders' }))
    const section = within(screen.getByRole('region', { name: 'Order history' }))
    expect(await section.findByTestId('query-state-refetch-error')).toBeInTheDocument()
    expect(section.getAllByText('#RF-10064')).toHaveLength(2)
    expect(secondPageCalls).toBe(1)
    await userEvent.click(section.getByRole('button', { name: 'Try again' }))
    expect(await section.findAllByText('#RF-10065')).toHaveLength(2)
    expect(secondPageCalls).toBe(2)
    expect(http.get.mock.calls.filter(([request]) => request.query?.page === 1)).toHaveLength(1)
  })

  it('handles initial Show 404 distinctly and retries a safe generic Show failure', async () => {
    http.get.mockImplementation(async ({ url }: { url: string }) => {
      if (url.endsWith('/orders')) return ordersReply()
      throw { isAxiosError: true, response: { status: 404 } }
    })
    const first = renderPage()
    expect(await screen.findByRole('heading', { name: 'Customer not found' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Order history' })).not.toBeInTheDocument()
    first.unmount()
    http.get.mockImplementation(async ({ url }: { url: string }) => {
      if (url.endsWith('/orders')) return ordersReply()
      throw new Error('private show failure')
    })
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('private show failure')).not.toBeInTheDocument()
    http.get.mockImplementation(async ({ url }: { url: string }) =>
      url.endsWith('/orders') ? ordersReply() : detailReply()
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await profile()
    expect(screen.getByRole('region', { name: 'Order history' })).toBeInTheDocument()
  })

  it.each([500, 404])(
    'preserves profile and Orders on background %s and disables access until retry succeeds',
    async (status) => {
      const { client } = renderPage()
      await profile()
      await screen.findByRole('table', { name: 'Order history' })
      http.get.mockRejectedValueOnce({ isAxiosError: true, response: { status } })
      await act(async () => {
        await client.invalidateQueries({ queryKey: customersKeys.detail(12), exact: true })
      })
      expect(await screen.findByTestId('query-state-refetch-error')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'API Test User' })).toBeInTheDocument()
      expect(screen.getByRole('table', { name: 'Order history' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Block' })).toBeDisabled()
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
      await waitFor(() => expect(screen.getByRole('button', { name: 'Block' })).toBeEnabled())
      expect(http.get.mock.calls.filter(([request]) => request.url.endsWith('/orders'))).toHaveLength(1)
    }
  )

  it.each(['block', 'unblock'] as const)(
    'confirms %s once, conservatively refreshes exact detail and lists, and retains Orders',
    async (action) => {
      const initiallyBlocked = action === 'unblock'
      const initial = {
        ...customer,
        is_blocked: initiallyBlocked,
        blocked_at: initiallyBlocked ? customer.created_at : null,
      }
      let current = initial
      let resolve!: (value: unknown) => void
      http.get.mockImplementation(async ({ url }: { url: string }) =>
        url.endsWith('/orders') ? ordersReply() : detailReply(current)
      )
      http.post.mockImplementation(
        () =>
          new Promise((done) => {
            resolve = done
          })
      )
      const { client } = renderPage()
      client.setQueryData(customersKeys.list(emptyCustomersFilters), { pages: [], pageParams: [] })
      await profile()
      await screen.findByRole('table', { name: 'Order history' })
      const invalidate = vi.spyOn(client, 'invalidateQueries')
      const label = initiallyBlocked ? 'Unblock' : 'Block'
      const access = within(screen.getByRole('region', { name: 'Access status' }))
      expect(access.getAllByRole('term').map((term) => term.textContent)).toEqual(['Access', 'Blocked at'])
      expect(access.getByText(initiallyBlocked ? 'Blocked' : 'Allowed')).toBeInTheDocument()
      expect(
        access.getByText(initiallyBlocked ? formatDateTime(customer.created_at, { locale: 'en' }) : '—')
      ).toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: label }))
      const dialog = await screen.findByRole('alertdialog')
      expect(dialog.querySelector('input,textarea')).toBeNull()
      const confirm = within(dialog).getByRole('button', { name: label })
      expect(http.post).not.toHaveBeenCalled()
      fireEvent.click(confirm)
      fireEvent.click(confirm)
      await waitFor(() => expect(http.post).toHaveBeenCalledTimes(1))
      expect(http.post).toHaveBeenCalledWith({
        url: `/dashboard/customers/12/${action}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
      current = { ...initial, is_blocked: !initiallyBlocked }
      await act(async () => resolve({ data: { success: true, data: { undocumented: 'ignored' } } }))
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
      expect(screen.getByRole('button', { name: initiallyBlocked ? 'Block' : 'Unblock' })).toBeEnabled()
      expect(invalidate.mock.calls.map(([options]) => options)).toEqual([
        { queryKey: customersKeys.lists() },
        { queryKey: customersKeys.detail(12), exact: true },
      ])
      expect(
        client
          .getMutationCache()
          .getAll()
          .some((mutation) => mutation.options.retry === false)
      ).toBe(true)
      expect(http.get.mock.calls.filter(([request]) => request.url === '/dashboard/customers/12')).toHaveLength(2)
      expect(http.get.mock.calls.filter(([request]) => request.url.endsWith('/orders'))).toHaveLength(1)
    }
  )

  it('shows safe mutation errors and disables an already-open confirmation on stale profile data', async () => {
    http.post.mockRejectedValue(new Error('private mutation failure'))
    const { client } = renderPage()
    await profile()
    await userEvent.click(screen.getByRole('button', { name: 'Block' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Block' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Customer could not be blocked.'))
    expect(screen.queryByText('private mutation failure')).not.toBeInTheDocument()
    http.get.mockRejectedValueOnce(new Error('refresh failed'))
    await act(async () => {
      await client.invalidateQueries({ queryKey: customersKeys.detail(12), exact: true })
    })
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Block' })).toBeDisabled())
    fireEvent.click(within(dialog).getByRole('button', { name: 'Block' }))
    expect(http.post).toHaveBeenCalledTimes(1)
  })

  it('supports Arabic, localized preferences/dates and key parity', async () => {
    await i18n.changeLanguage('ar')
    renderPage()
    await profile()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('button', { name: 'حظر' })).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: ar.customers.detail.account })).getByText(ar.customers.values.no)
    ).toBeInTheDocument()
    expect(screen.getAllByText(formatDateTime(customer.created_at, { locale: 'ar' })).length).toBeGreaterThan(0)
    const access = within(screen.getByRole('region', { name: ar.customers.detail.access }))
    expect(access.getAllByRole('term').map((term) => term.textContent)).toEqual([
      ar.customers.fields.access,
      ar.customers.fields.blockedAt,
    ])
    const keys = (value: object, prefix = ''): string[] =>
      Object.entries(value).flatMap(([key, entry]) =>
        entry && typeof entry === 'object' ? keys(entry, `${prefix}${key}.`) : [`${prefix}${key}`]
      )
    // Arabic has additional plural forms, while all other detail/action keys must match.
    expect(keys(en.customers.detail).sort()).toEqual(keys(ar.customers.detail).sort())
    expect(keys(en.customers.fields).sort()).toEqual(keys(ar.customers.fields).sort())
    expect(keys(en.customers.actions).sort()).toEqual(keys(ar.customers.actions).sort())
    expect(keys(en.customers.orders.fields).sort()).toEqual(keys(ar.customers.orders.fields).sort())
  })
})
