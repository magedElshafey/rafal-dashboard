import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import OrdersPage from '../pages/OrdersPage'
import { installDomMocks, renderOrders } from './test-utils'
import index from './orders-index.fixture.json'
import statuses from './statuses.fixture.json'
import { formatDateTime } from '@/utils/date/date.helpers'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
type Request = { url: string; query?: Record<string, unknown> }
const indexCalls = () =>
  http.get.mock.calls.map((call) => call[0] as Request).filter((request) => request.url === '/dashboard/orders')
let listResponse: unknown
beforeEach(async () => {
  vi.clearAllMocks()
  installDomMocks()
  await i18n.changeLanguage('en')
  listResponse = { ...index, meta: { ...index.meta, last_page: 1 } }
  http.get.mockImplementation(async ({ url }: Request) => {
    if (url.endsWith('/statuses')) return { data: statuses }
    if (url === '/dashboard/warehouses')
      return {
        data: {
          success: true,
          data: [{ id: 2, name: 'Jeddah West Warehouse', is_active: true }],
          meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
        },
      }
    return { data: listResponse }
  })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Orders Index', () => {
  it('renders backend rows and mobile cards with facts and View navigation', async () => {
    const { container } = renderOrders(<OrdersPage />)
    await screen.findAllByText('#RF-10021')
    const desktop = container.querySelector('[data-slot="responsive-data-desktop"]')
    const mobile = container.querySelector('[data-slot="responsive-data-mobile-cards"]')
    expect(desktop).toHaveClass('hidden', 'lg:block')
    expect(mobile).toHaveClass('lg:hidden')
    for (const root of [desktop, mobile]) {
      if (!(root instanceof HTMLElement)) throw new Error('Missing responsive view')
      for (const text of ['maged elshafey', 'Confirmed', 'Paid', 'No', '4,003.13 SAR', 'Jeddah West Warehouse'])
        expect(within(root).getByText(text)).toBeInTheDocument()
      expect(within(root).getByText(formatDateTime(index.data[0].placed_at, { locale: 'en' }))).toBeInTheDocument()
      expect(within(root).getByRole('button', { name: 'View order #RF-10021' })).toBeInTheDocument()
    }
    await userEvent.click(screen.getAllByRole('button', { name: 'View order #RF-10021' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/orders/21')
    expect(http.patch).not.toHaveBeenCalled()
  })
  it('renders fallback registered customer, pending payment and gift facts', async () => {
    listResponse = {
      ...index,
      data: [
        {
          ...index.data[0],
          is_gift: true,
          payment_status: 'pending',
          customer: { type: 'registered', name: '', email: 'registered@example.test', phone: '' },
        },
      ],
      meta: { ...index.meta, last_page: 1 },
    }
    renderOrders(<OrdersPage />)
    expect((await screen.findAllByText('registered@example.test')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pending')).toHaveLength(2)
    expect(screen.getAllByText('Yes')).toHaveLength(2)
  })
  it('shows a stable skeleton, then empty state', async () => {
    let resolve: (value: unknown) => void = () => {}
    http.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    renderOrders(<OrdersPage />)
    expect(screen.getByText('Loading content...')).toBeInTheDocument()
    await act(async () => resolve({ data: { ...index, data: [], meta: { ...index.meta, last_page: 1, total: 0 } } }))
    expect(await screen.findByText('No matching orders')).toBeInTheDocument()
  })
  it('recovers initial failure through Retry without exposing raw errors', async () => {
    http.get.mockRejectedValueOnce(new Error('internal SQL stack'))
    renderOrders(<OrdersPage />)
    expect(await screen.findByText('Unable to load content')).toBeInTheDocument()
    expect(screen.queryByText('internal SQL stack')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findAllByText('#RF-10021')).toHaveLength(2)
  })
  it('retains current Orders on page-two failure, retries only page two, and stops at the last page', async () => {
    let failPageTwo = true
    http.get.mockImplementation(async ({ url, query }: Request) => {
      if (url.endsWith('/statuses')) return { data: statuses }
      if (query?.page === 2) {
        if (failPageTwo) throw new Error('page two')
        return {
          data: {
            ...index,
            data: [{ ...index.data[0], id: 22, display_number: '#RF-10022' }],
            meta: { ...index.meta, current_page: 2 },
          },
        }
      }
      return { data: index }
    })
    renderOrders(<OrdersPage />)
    await screen.findAllByText('#RF-10021')
    await userEvent.click(screen.getByRole('button', { name: 'Load more orders' }))
    await screen.findByText('Unable to refresh data')
    expect(screen.getAllByText('#RF-10021')).toHaveLength(2)
    expect(indexCalls().map((call) => call.query?.page)).toEqual([1, 2])
    failPageTwo = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findAllByText('#RF-10022')
    expect(screen.getAllByText('#RF-10021')).toHaveLength(2)
    expect(indexCalls().map((call) => call.query?.page)).toEqual([1, 2, 2])
    expect(screen.queryByRole('button', { name: 'Load more orders' })).not.toBeInTheDocument()
  })
})

describe('URL search and server filters', () => {
  it('starts a new pagination stream when search changes after loading page two', async () => {
    http.get.mockImplementation(async ({ url, query }: Request) => {
      if (url.endsWith('/statuses')) return { data: statuses }
      const page = query?.page === 2 ? 2 : 1
      return {
        data: {
          ...index,
          data: [
            { ...index.data[0], id: page === 2 ? 22 : 21, display_number: page === 2 ? '#RF-10022' : '#RF-10021' },
          ],
          meta: { ...index.meta, current_page: page },
        },
      }
    })
    renderOrders(<OrdersPage />)
    await screen.findAllByText('#RF-10021')
    await userEvent.click(screen.getByRole('button', { name: 'Load more orders' }))
    await screen.findAllByText('#RF-10022')
    vi.useFakeTimers()
    fireEvent.change(screen.getByRole('textbox', { name: 'Search orders' }), { target: { value: 'new query' } })
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await act(async () => {
      vi.runOnlyPendingTimers()
    })
    expect(indexCalls().at(-1)?.query).toEqual({ search: 'new query', page: 1 })
    expect(screen.queryByText('#RF-10022')).not.toBeInTheDocument()
    expect(screen.getAllByText('#RF-10021')).toHaveLength(2)
  })
  it('debounces even one character, starts page one, and never filters the loaded array', async () => {
    renderOrders(<OrdersPage />)
    await screen.findAllByText('#RF-10021')
    vi.useFakeTimers()
    fireEvent.change(screen.getByRole('textbox', { name: 'Search orders' }), { target: { value: 'z' } })
    await act(async () => {
      vi.advanceTimersByTime(599)
    })
    expect(indexCalls()).toHaveLength(1)
    await act(async () => {
      vi.advanceTimersByTime(1)
    })
    expect(indexCalls().at(-1)?.query).toEqual({ search: 'z', page: 1 })
    await act(async () => {
      vi.runOnlyPendingTimers()
    })
    expect(screen.getAllByText('#RF-10021')).toHaveLength(2)
    expect(screen.getByTestId('location')).toHaveTextContent('search=z')
  })
  it('sends URL filters with exact keys and resets all filters and pending search', async () => {
    renderOrders(
      <OrdersPage />,
      '/dashboard/orders?search=RF&status=confirmed&payment_status=paid&warehouse_id=2&is_gift=0&is_guest=1&date_from=2026-10-01&date_to=2026-10-04'
    )
    await screen.findAllByText('#RF-10021')
    expect(indexCalls()[0].query).toEqual({
      search: 'RF',
      status: 'confirmed',
      payment_status: 'paid',
      warehouse_id: 2,
      is_gift: 0,
      is_guest: 1,
      date_from: '2026-10-01',
      date_to: '2026-10-04',
      page: 1,
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Search orders' }), { target: { value: 'pending input' } })
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(indexCalls().at(-1)?.query).toEqual({ page: 1 }))
    expect(screen.getByRole('textbox', { name: 'Search orders' })).toHaveValue('')
    expect(screen.getByTestId('location')).toHaveTextContent(/^\/dashboard\/orders$/)
  })
  it('blocks an invalid URL date range without a backend list request', async () => {
    renderOrders(<OrdersPage />, '/dashboard/orders?date_from=2026-10-05&date_to=2026-10-04')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter valid dates')
    expect(indexCalls()).toHaveLength(0)
    await userEvent.click(screen.getAllByRole('button', { name: 'Clear filters' })[0])
    await screen.findAllByText('#RF-10021')
    expect(indexCalls()).toHaveLength(1)
  })
  it('loads status options from metadata and offers only confirmed payment filters', async () => {
    const user = userEvent.setup()
    renderOrders(<OrdersPage />)
    await screen.findAllByText('#RF-10021')
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('combobox', { name: 'Status' }))
    expect(screen.getAllByRole('option')).toHaveLength(9)
    await user.click(screen.getByRole('option', { name: 'Processing' }))
    await user.click(screen.getByRole('combobox', { name: 'Payment status' }))
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Paid', 'Pending'])
    await user.click(screen.getByRole('option', { name: 'Pending' }))
    await user.click(screen.getByRole('combobox', { name: 'Warehouse' }))
    await user.click(await screen.findByRole('option', { name: 'Jeddah West Warehouse' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Gift' }), '0')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Guest order' }), '1')
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-10-04' } })
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() =>
      expect(indexCalls().at(-1)?.query).toEqual({
        status: 'processing',
        payment_status: 'pending',
        warehouse_id: 2,
        is_gift: 0,
        is_guest: 1,
        date_from: '2026-10-01',
        date_to: '2026-10-04',
        page: 1,
      })
    )
    expect(http.get.mock.calls.filter((call) => (call[0] as Request).url.endsWith('/statuses'))).toHaveLength(1)
  })
  it('restores URL filters on browser back navigation', async () => {
    renderOrders(<OrdersPage />, '/dashboard/orders?is_gift=0')
    await screen.findAllByText('#RF-10021')
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    await waitFor(() => expect(indexCalls().at(-1)?.query).toEqual({ page: 1 }))
    await userEvent.click(screen.getByRole('button', { name: 'Test back' }))
    await waitFor(() => expect(indexCalls().at(-1)?.query).toEqual({ is_gift: 0, page: 1 }))
  })
})
