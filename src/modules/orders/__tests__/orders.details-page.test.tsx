import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { formatDateTime } from '@/utils/date/date.helpers'
import { ordersService } from '../api/orders.service'
import OrderDetailPage from '../pages/OrderDetailPage'
import { OrderDetailsHeader } from '../components/OrderDetailsHeader'
import { normalizeOrderDetail } from '../utils/order-normalizers'
import { ordersKeys } from '../queries/orders.keys'
import { renderOrders } from './test-utils'
import show from './order-dashboard-show.fixture.json'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))

beforeEach(async () => {
  http.get.mockReset().mockResolvedValue({ data: show })
  http.patch.mockReset()
  await i18n.changeLanguage('en')
})

describe('production Order Details', () => {
  it('renders the confirmed dashboard aggregate with one Show request and the canonical key', async () => {
    const service = vi.spyOn(ordersService, 'show')
    const { client, container } = renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    expect(await screen.findByRole('heading', { name: '#RF-10208', level: 1 })).toBeInTheDocument()
    expect(service).toHaveBeenCalledExactlyOnceWith(208, expect.any(AbortSignal))
    expect(http.get).toHaveBeenCalledExactlyOnceWith({
      url: '/dashboard/orders/208',
      signal: expect.any(AbortSignal),
      suppressErrorNotification: true,
    })
    expect(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey)
    ).toEqual([ordersKeys.detail(208)])
    expect(client.getQueryData(ordersKeys.detail(208))).toEqual(normalizeOrderDetail(show.data))
    const customer = within(screen.getByRole('region', { name: 'Customer' }))
    for (const value of ['sayed', 'Guest', 'tet@test.com', '01091043665'])
      expect(customer.getByText(value)).toBeInTheDocument()
    const shipping = within(screen.getByRole('region', { name: 'Shipping address' }))
    for (const value of ['abdullah', '01091043660', 'الرياض', '5 squar', '5 home on street 4'])
      expect(shipping.getByText(value)).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Items' })).toBeInTheDocument()
    expect(screen.getAllByText('Test Product A')).toHaveLength(2)
    expect(screen.getAllByText('SKU-A-RED')).toHaveLength(2)
    expect(screen.getAllByText('red')).toHaveLength(2)
    const summary = within(screen.getByRole('region', { name: 'Money summary' }))
    expect(summary.getByText('140.00 SAR')).toBeInTheDocument()
    expect(summary.getByText('18.26 SAR')).toBeInTheDocument()
    expect(summary.getAllByText('—')).toHaveLength(2)
    expect(screen.getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText(show.data.payment.reference)).toBeInTheDocument()
    expect(screen.getByText('Madinah Warehouse')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Gift' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Status history' })).getByRole('list').children).toHaveLength(2)
    expect(within(screen.getByRole('region', { name: 'Order metadata' })).getByText('208')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(container.querySelector('input,textarea')).toBeNull()
    const ids = Array.from(container.querySelectorAll('[id]')).map((element) => element.id)
    expect(new Set(ids).size).toBe(ids.length)
    service.mockRestore()
  })

  it.each(['0', '-1', 'abc', '1.5', '1e2', '9007199254740992'])(
    'handles invalid ID %s without any query or API request',
    (id) => {
      const { client } = renderOrders(<OrderDetailPage />, `/dashboard/orders/${id}`)
      expect(screen.getByRole('heading', { name: 'Order not found' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Back to orders' })).toHaveAttribute('href', '/dashboard/orders')
      expect(http.get).not.toHaveBeenCalled()
      expect(client.getQueryCache().getAll()).toHaveLength(0)
    }
  )

  it('forwards cancellation and aborts the request on unmount', () => {
    http.get.mockImplementation(() => new Promise(() => {}))
    const { unmount } = renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    const signal: AbortSignal = http.get.mock.calls[0][0].signal
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
  })

  it('immediately reuses cached canonical data while the normal freshness policy refetches', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    client.setQueryData(ordersKeys.detail(208), normalizeOrderDetail(show.data))
    http.get.mockImplementation(() => new Promise(() => {}))
    renderOrders(<OrderDetailPage />, '/dashboard/orders/208', client)
    expect(screen.getByRole('heading', { name: '#RF-10208', level: 1 })).toBeInTheDocument()
    expect(screen.queryByTestId('query-loading-state')).not.toBeInTheDocument()
    expect(http.get).toHaveBeenCalledTimes(1)
  })

  it('keeps exact backend totals even when they differ from item and fee arithmetic', async () => {
    http.get.mockResolvedValue({
      data: {
        ...show,
        data: { ...show.data, money: { ...show.data.money, total: '999999999999999999.123', currency: 'USD' } },
      },
    })
    renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    expect(await screen.findByText('999,999,999,999,999,999.123 USD')).toBeInTheDocument()
    expect(screen.queryByText('140.00 USD')).not.toBeInTheDocument()
  })

  it('uses section empty states and scalar fallbacks without making a valid order empty', async () => {
    http.get.mockResolvedValue({
      data: {
        ...show,
        data: {
          ...show.data,
          items: [],
          status_history: [],
          shipping_address: null,
          warehouse: null,
          gift: null,
          allowed_transitions: [],
          payment: { ...show.data.payment, method: 'future_method', reference: null, paid_at: null },
        },
      },
    })
    renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    expect(await screen.findByRole('heading', { name: '#RF-10208', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('No items returned for this order.')).toBeInTheDocument()
    expect(screen.getByText('No status history returned for this order.')).toBeInTheDocument()
    expect(screen.getByText('future method')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Payment' })).getAllByText('—')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Update status' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Order not found' })).not.toBeInTheDocument()
    expect(screen.queryByText(/^(null|undefined)$/)).not.toBeInTheDocument()
  })

  it('preserves history order even when timestamps are not ascending', async () => {
    http.get.mockResolvedValue({
      data: {
        ...show,
        data: {
          ...show.data,
          status_history: [
            {
              ...show.data.status_history[1],
              note: 'First backend event',
              actor_type: 'admin',
              actor_name: 'Order operator',
              created_at: '2026-10-01T10:00:00Z',
            },
            { ...show.data.status_history[0], note: 'Second backend event' },
          ],
        },
      },
    })
    renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    const history = await screen.findByRole('region', { name: 'Status history' })
    const entries = within(history).getAllByRole('listitem')
    expect(entries[0]).toHaveTextContent('First backend event')
    expect(entries[0]).toHaveTextContent('Order operator')
    expect(entries[1]).toHaveTextContent('Second backend event')
    expect(entries[1]).toHaveTextContent('System')
  })

  it('renders multiple items with long identifiers and omits empty variant attribute markup', async () => {
    const longName = 'اسم منتج طويل '.repeat(25)
    const longSku = 'VERY-LONG-SKU-'.repeat(30)
    http.get.mockResolvedValue({
      data: {
        ...show,
        data: {
          ...show.data,
          items: [
            { ...show.data.items[0], product_name: longName, variant_sku: longSku, variant_attributes: [] },
            {
              ...show.data.items[0],
              id: 144,
              product_name: 'Second item',
              variant_sku: 'SECOND',
              variant_attributes: {},
            },
          ],
        },
      },
    })
    const { container } = renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    const table = await screen.findByRole('table', { name: 'Items' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(screen.getAllByText(longSku)).toHaveLength(2)
    expect(screen.getAllByText(longName.trim())).toHaveLength(2)
    expect(container.querySelectorAll('tbody dl')).toHaveLength(0)
    expect(within(screen.getByRole('region', { name: 'Items' })).queryByRole('link')).not.toBeInTheDocument()
  })

  it('uses identical major section/card/grid, item and timeline geometry during loading', async () => {
    let resolve!: (value: unknown) => void
    http.get.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { container } = renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    const structure = () =>
      Array.from(container.querySelectorAll('section'))
        .filter((section) => section.querySelector('h2'))
        .map((section) => ({
          title: section.querySelector('h2')?.textContent,
          grid: section.parentElement?.className,
          card: section.firstElementChild?.className,
          labels: Array.from(section.querySelectorAll('dt'))
            .map((dt) => dt.textContent)
            .filter((text) => text !== 'color'),
        }))
    const loadingStructure = structure()
    const tableColumns = Array.from(container.querySelectorAll('th')).map((th) => th.textContent)
    const historyClass = container.querySelector('ol')?.className
    const loadingItemClass = container.querySelector('tbody tr')?.className
    const loadingRegion = screen.getByTestId('query-loading-state')
    expect(loadingRegion).toHaveAttribute('aria-busy', 'true')
    expect(loadingRegion.querySelector('a,button,input,select')).toBeNull()
    expect(loadingRegion.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(30)
    await act(async () => resolve({ data: show }))
    await screen.findByRole('heading', { name: '#RF-10208', level: 1 })
    // Collection lengths depend on the response; compare each region's structure, not placeholder row count.
    expect(structure().map(({ title, grid, card }) => ({ title, grid, card }))).toEqual(
      loadingStructure.map(({ title, grid, card }) => ({ title, grid, card }))
    )
    expect(structure().filter(({ title }) => title !== 'Items')).toEqual(
      loadingStructure.filter(({ title }) => title !== 'Items')
    )
    expect(Array.from(container.querySelectorAll('th')).map((th) => th.textContent)).toEqual(tableColumns)
    expect(container.querySelector('tbody tr')?.className).toBe(loadingItemClass)
    expect(container.querySelector('ol')?.className).toBe(historyClass)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull()
  })

  it('shows a distinct initial 404 and safe generic failure with retry', async () => {
    http.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
    const first = renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    expect(await screen.findByRole('heading', { name: 'Order not found' })).toBeInTheDocument()
    expect(screen.queryByTestId('query-state-loading-error')).not.toBeInTheDocument()
    first.unmount()
    http.get.mockRejectedValueOnce(new Error('private internals'))
    renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('private internals')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: '#RF-10208', level: 1 })).toBeInTheDocument()
  })

  it.each([500, 404])('preserves all details on background HTTP %i and permits recovery', async (status) => {
    const { client } = renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    await screen.findByRole('heading', { name: '#RF-10208' })
    http.get.mockRejectedValueOnce({ isAxiosError: true, response: { status } })
    await act(async () => {
      await client.invalidateQueries({ queryKey: ordersKeys.detail(208), exact: true })
    })
    expect(await screen.findByTestId('query-state-refetch-error')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '#RF-10208' })).toBeInTheDocument()
    expect(screen.getByText('140.00 SAR')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Order not found' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update status' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.queryByTestId('query-state-refetch-error')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Update status' })).toBeEnabled()
  })

  it('uses display number, order number and localized title fallbacks', () => {
    const order = normalizeOrderDetail(show.data)
    const first = renderOrders(<OrderDetailsHeader order={{ ...order, displayNumber: '' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'RF-10208' })).toBeInTheDocument()
    first.unmount()
    renderOrders(<OrderDetailsHeader order={{ ...order, displayNumber: '', orderNumber: '' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Order details' })).toBeInTheDocument()
  })

  it('supports keyboard status actions and locale-formatted header dates', async () => {
    const user = userEvent.setup()
    renderOrders(<OrderDetailPage />, '/dashboard/orders/208')
    const back = await screen.findByRole('link', { name: 'Back to orders' })
    back.focus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Update status' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Select an allowed status',
      'Processing',
      'Cancelled',
    ])
    expect(
      within(document.querySelector('main header')!).getByText(formatDateTime(show.data.placed_at, { locale: 'en' }))
    ).toBeInTheDocument()
  })
})
