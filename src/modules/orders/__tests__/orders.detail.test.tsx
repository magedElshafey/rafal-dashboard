import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import OrderDetailPage from '../pages/OrderDetailPage'
import { VariantAttributes } from '../components/OrderItems'
import { ordersKeys } from '../queries/orders.keys'
import { emptyOrdersFilters } from '../utils/order-filters'
import { normalizeOrderDetail } from '../utils/order-normalizers'
import { orderMoneyLabel } from '../utils/order-presentation'
import { installDomMocks, renderOrders } from './test-utils'
import show from './order-detail.fixture.json'
import gift from './order-gift.fixture.json'
import statuses from './statuses.fixture.json'
import en from '../locale/en.json'
import ar from '../locale/ar.json'
import { cancelledOrder20, confirmedOrder18, processingOrder19 } from './order-detail-runtime.fixtures'
import { formatDateTime } from '@/utils/date/date.helpers'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast }))
let canonical: unknown
const updated = {
  ...show.data,
  status: 'processing',
  allowed_transitions: ['shipped', 'cancelled'],
  status_history: [
    ...show.data.status_history,
    {
      from_status: 'confirmed',
      to_status: 'processing',
      note: null,
      actor_type: 'admin',
      actor_id: 1,
      actor_name: 'Super Admin',
      created_at: '2026-10-04T06:41:25+00:00',
    },
  ],
}
const failure = {
  success: false,
  message: 'Cannot transition order from confirmed to delivered',
  errors: {
    status: ['Cannot transition order from confirmed to delivered'],
    allowed_transitions: ['processing', 'cancelled'],
  },
}
beforeEach(async () => {
  vi.clearAllMocks()
  installDomMocks()
  await i18n.changeLanguage('en')
  canonical = show
  http.get.mockImplementation(async ({ url }: { url: string }) => ({
    data: url.endsWith('/statuses') ? statuses : canonical,
  }))
  http.patch.mockImplementation(async () => {
    canonical = { ...show, data: updated }
    return { data: canonical }
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('Order Show', () => {
  it('renders all real detail sections, money, attributes and semantic history', async () => {
    renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    await screen.findByRole('heading', { name: '#RF-10021', level: 1 })
    for (const title of [
      'Order summary',
      'Customer',
      'Shipping address',
      'Money summary',
      'Items',
      'Payment',
      'Warehouse',
      'Status history',
    ])
      expect(screen.getByRole('heading', { name: title, level: 2 })).toBeInTheDocument()
    for (const text of [
      'Makkah',
      'Tenetur consectetur',
      'الهايشة',
      '3,202.50 SAR',
      '800.63 SAR',
      '4,003.13 SAR',
      '25.00%',
      'No coupon applied',
      show.data.payment.reference,
      'Jeddah West Warehouse',
    ])
      expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getAllByText('#03C4DD')).toHaveLength(2)
    expect(screen.getAllByText('montag 1')).toHaveLength(2)
    expect(screen.getByRole('list').children).toHaveLength(3)
    expect(screen.queryByRole('heading', { name: 'Gift' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to orders' })).toHaveAttribute('href', '/dashboard/orders')
  })
  it('renders only validated six-digit HEX swatches while retaining exact read keys and text', () => {
    const { container } = renderOrders(
      <VariantAttributes attributes={{ color: '#03C4DD', stone_type: 'Diamond', تيست_تيست_تيست: '11117' }} />
    )
    expect(screen.getByText('stone_type')).toBeInTheDocument()
    expect(screen.getByText('تيست_تيست_تيست')).toBeInTheDocument()
    expect(screen.getByText('#03C4DD')).toBeInTheDocument()
    expect(container.querySelector('[style]')).toHaveStyle({ backgroundColor: '#03C4DD' })
    const legacy = renderOrders(<VariantAttributes attributes={{ color: 'red' }} />)
    expect(screen.getByText('red')).toBeInTheDocument()
    expect(legacy.container.querySelector('[style]')).toBeNull()
  })
  it('renders gift facts only when supplied, and isolates unknown coupon data', async () => {
    canonical = {
      ...show,
      data: {
        ...show.data,
        gift: { ...gift, message: 'A real gift message' },
        coupon: { unconfirmed: 'DO NOT RENDER' },
      },
    }
    renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    expect(await screen.findByRole('heading', { name: 'Gift' })).toBeInTheDocument()
    expect(screen.getByText('A real gift message')).toBeInTheDocument()
    expect(screen.queryByText('DO NOT RENDER')).not.toBeInTheDocument()
  })
  it.each(['en', 'ar'])(
    'renders the complete real Gift in %s with localized labels and direction-safe values',
    async (language) => {
      await i18n.changeLanguage(language)
      canonical = { ...show, data: { ...show.data, gift, money: { ...show.data.money, currency: 'USD' } } }
      renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
      const copy = language === 'ar' ? ar.orders : en.orders
      const heading = await screen.findByRole('heading', { name: copy.fields.gift, level: 2 })
      const section = heading.closest('section')
      if (!(section instanceof HTMLElement)) throw new Error('Missing Gift section')
      const facts = within(section)
      for (const [label, value] of [
        [copy.gift.anonymous, copy.no],
        [copy.gift.wrap, copy.yes],
        [copy.gift.message, copy.unavailable],
        [copy.gift.wrapFee, orderMoneyLabel('15.00', 'USD', language)],
      ]) {
        const row = facts.getByText(label).parentElement
        if (!row) throw new Error('Missing Gift fact')
        expect(within(row).getByText(value)).toBeInTheDocument()
      }
      const buyer = facts.getByRole('region', { name: copy.gift.buyer })
      for (const value of [copy.values.guest, 'sayed', 'tet@test.com', '01091043665'])
        expect(within(buyer).getByText(value)).toBeInTheDocument()
      const recipient = facts.getByRole('region', { name: copy.gift.recipient })
      for (const value of ['sayed', '01091043660', 'الرياض', 'الحي السادس', 'شارع الهرم']) {
        expect(within(recipient).getByText(value).tagName).toBe('BDI')
      }
      expect(document.documentElement.dir).toBe(language === 'ar' ? 'rtl' : 'ltr')
      for (const rawLabel of ['is_anonymous', 'wrap_fee', 'street_details', 'null', 'undefined'])
        expect(facts.queryByText(rawLabel)).not.toBeInTheDocument()
    }
  )
  it('shows anonymous buyer details and wrap=false independently of fee, with nullable recipient city', async () => {
    canonical = {
      ...show,
      data: {
        ...show.data,
        gift: {
          ...gift,
          is_anonymous: true,
          wrap: false,
          buyer: { ...gift.buyer, type: 'future_buyer' },
          recipient: { ...gift.recipient, city: null },
        },
      },
    }
    renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    const heading = await screen.findByRole('heading', { name: 'Gift', level: 2 })
    const section = heading.closest('section')
    if (!(section instanceof HTMLElement)) throw new Error('Missing Gift section')
    const facts = within(section)
    for (const [label, value] of [
      ['Anonymous', 'Yes'],
      ['Gift wrap', 'No'],
      ['City', 'Unavailable'],
    ]) {
      const row = facts.getByText(label).parentElement
      if (!row) throw new Error('Missing Gift fact')
      expect(within(row).getByText(value)).toBeInTheDocument()
    }
    expect(facts.getByText('15.00 SAR')).toBeInTheDocument()
    expect(facts.getByText('future buyer')).toBeInTheDocument()
    expect(facts.getByText('tet@test.com')).toBeInTheDocument()
  })
  it('renders non-gift Order 21 with explicit null gift without a Gift section', async () => {
    canonical = { ...show, data: { ...show.data, gift: null } }
    renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    await screen.findByRole('heading', { name: '#RF-10021' })
    expect(screen.queryByRole('heading', { name: 'Gift' })).not.toBeInTheDocument()
    expect(screen.getByText('15.00 SAR')).toBeInTheDocument()
  })
  it('rejects invalid route IDs and recovers a failed Show with Retry', async () => {
    const invalid = renderOrders(<OrderDetailPage />, '/dashboard/orders/invalid')
    expect(screen.getByRole('alert')).toHaveTextContent('This order ID is invalid')
    expect(http.get.mock.calls.filter((call) => call[0].url === '/dashboard/orders/invalid')).toHaveLength(0)
    invalid.unmount()
    http.get.mockImplementation(async ({ url }: { url: string }) => {
      if (!url.endsWith('/statuses')) throw new Error('hidden stack')
      return { data: statuses }
    })
    renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    await screen.findByText('Unable to load content')
    http.get.mockImplementation(async ({ url }: { url: string }) => ({
      data: url.endsWith('/statuses') ? statuses : show,
    }))
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: '#RF-10021' })).toBeInTheDocument()
  })
  it.each([
    [18, 'Confirmed', confirmedOrder18],
    [19, 'Processing', processingOrder19],
    [20, 'Cancelled', cancelledOrder20],
  ])('renders real Order %i (%s) without entering the load-error state', async (id, statusLabel, response) => {
    canonical = response
    renderOrders(<OrderDetailPage />, `/dashboard/orders/${id}`)
    expect(await screen.findByRole('heading', { name: response.data.display_number, level: 1 })).toBeInTheDocument()
    expect(screen.getAllByText(statusLabel).length).toBeGreaterThan(0)
    expect(screen.queryByText('Unable to load content')).not.toBeInTheDocument()
  })
  it('renders the full terminal cancelled Order with safe customer, attributes and personalization facts', async () => {
    canonical = cancelledOrder20
    renderOrders(<OrderDetailPage />, '/dashboard/orders/20')
    await screen.findByRole('heading', { name: '#RF-10020', level: 1 })
    expect(screen.getAllByText('magedelshafey98@gmail.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('White Musk Perfume')).toHaveLength(2)
    expect(screen.getAllByText('Historic White Variant')).toHaveLength(2)
    expect(screen.getAllByText('gold')).toHaveLength(2)
    expect(screen.getAllByText('#03C4DD')).toHaveLength(2)
    expect(screen.getAllByText('توتا')).toHaveLength(2)
    expect(screen.getAllByText('19.84 SAR')).toHaveLength(2)
    const cancelledRow = screen.getByText('Cancelled at').parentElement
    if (!cancelledRow) throw new Error('Missing cancelled timestamp row')
    expect(
      within(cancelledRow).getByText(formatDateTime(cancelledOrder20.data.cancelled_at, { locale: 'en' }))
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Update status' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Next status' })).not.toBeInTheDocument()
    expect(http.patch).not.toHaveBeenCalled()
  })
  it('supports Arabic, RTL and complete locale key parity', async () => {
    const keys = (value: object, prefix = ''): string[] =>
      Object.entries(value).flatMap(([key, entry]) =>
        entry && typeof entry === 'object' ? keys(entry, `${prefix}${key}.`) : [`${prefix}${key}`]
      )
    expect(keys(en)).toEqual(keys(ar))
    await i18n.changeLanguage('ar')
    renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    await screen.findByRole('heading', { name: '#RF-10021' })
    expect(screen.getAllByText('مؤكد').length).toBeGreaterThan(0)
    expect(screen.getByText('مدفوع')).toBeInTheDocument()
    expect(document.documentElement.dir).toBe('rtl')
    await userEvent.click(screen.getByRole('button', { name: 'تحديث الحالة' }))
    expect(screen.getByRole('dialog')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('option', { name: 'قيد التجهيز' })).toBeInTheDocument()
  })
})

describe('status transitions', () => {
  it('offers only allowed transitions and requires explicit confirmation; empty transitions disable action', async () => {
    const view = renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    await screen.findByRole('heading', { name: '#RF-10021' })
    await userEvent.click(screen.getByRole('button', { name: 'Update status' }))
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog)
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(['Select an allowed status', 'Processing', 'Cancelled'])
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Next status' }), 'processing')
    expect(http.patch).not.toHaveBeenCalled()
    view.unmount()
    canonical = { ...show, data: { ...show.data, allowed_transitions: [] } }
    renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    await screen.findByRole('heading', { name: '#RF-10021' })
    expect(screen.queryByRole('button', { name: 'Update status' })).not.toBeInTheDocument()
  })
  it('prevents duplicate PATCH, updates exact detail/history/transitions and invalidates only Orders lists', async () => {
    let resolve: (value: unknown) => void = () => {}
    http.patch.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { client } = renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    client.setQueryDefaults(['products'], { gcTime: Infinity })
    client.setQueryData(ordersKeys.list(emptyOrdersFilters), { pages: [], pageParams: [] })
    client.setQueryData(['products'], ['untouched'])
    await screen.findByRole('heading', { name: '#RF-10021' })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await userEvent.click(screen.getByRole('button', { name: 'Update status' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Next status' }), 'processing')
    const confirm = screen.getByRole('button', { name: 'Confirm status update' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await waitFor(() => expect(http.patch).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Updating status…' })).toBeDisabled()
    expect(client.getQueryData(ordersKeys.detail(21))).toMatchObject({
      status: 'confirmed',
      statusHistory: expect.arrayContaining([
        {
          fromStatus: null,
          toStatus: 'new',
          note: 'Order placed',
          actorType: 'system',
          actorId: null,
          actorName: null,
          createdAt: show.data.placed_at,
        },
      ]),
    })
    canonical = { ...show, data: { ...updated, gift } }
    await act(async () => resolve({ data: canonical }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
    expect(client.getQueryData(ordersKeys.detail(21))).toEqual(normalizeOrderDetail({ ...updated, gift }))
    expect(screen.getByRole('heading', { name: 'Gift', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('tet@test.com')).toBeInTheDocument()
    expect(invalidate.mock.calls.map((call) => call[0])).toEqual([
      { queryKey: ordersKeys.detail(21), exact: true },
      { queryKey: ordersKeys.lists() },
    ])
    expect(client.getQueryState(['products'])?.isInvalidated).toBe(false)
    expect(client.getQueryState(ordersKeys.statuses())?.isInvalidated).toBe(false)
    expect(http.get.mock.calls.filter((call) => call[0].url === '/dashboard/orders/21')).toHaveLength(2)
    expect(client.getMutationCache().getAll()[0].options.retry).toBe(false)
    await userEvent.click(screen.getByRole('button', { name: 'Update status' }))
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Select an allowed status',
      'Shipped',
      'Cancelled',
    ])
  })
  it.each(['http', 'resolved'])(
    'handles real %s failure, retains order/dialog, refetches canonical transitions without retry',
    async (transport) => {
      http.patch.mockImplementation(async () => {
        canonical = { ...show, data: { ...show.data, allowed_transitions: ['cancelled'] } }
        if (transport === 'http')
          throw Object.assign(new Error('raw hidden message'), {
            isAxiosError: true,
            response: { status: 422, data: failure },
          })
        return { data: failure }
      })
      const { client } = renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
      await screen.findByRole('heading', { name: '#RF-10021' })
      await userEvent.click(screen.getByRole('button', { name: 'Update status' }))
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Next status' }), 'processing')
      await userEvent.click(screen.getByRole('button', { name: 'Confirm status update' }))
      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent(failure.message)
      expect(alert).not.toHaveTextContent('processing')
      expect(alert).not.toHaveTextContent('cancelled')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Next status' })).toHaveValue('')
      expect(screen.getByRole('button', { name: 'Confirm status update' })).toBeDisabled()
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        'Select an allowed status',
        'Cancelled',
      ])
      expect(client.getQueryData(ordersKeys.detail(21))).toMatchObject({
        status: 'confirmed',
        statusHistory: normalizeOrderDetail(show.data).statusHistory,
      })
      expect(http.get.mock.calls.filter((call) => call[0].url === '/dashboard/orders/21')).toHaveLength(2)
      expect(http.patch).toHaveBeenCalledTimes(1)
      expect(client.getMutationCache().getAll()[0].options.retry).toBe(false)
      expect(toast.error).not.toHaveBeenCalled()
      await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Next status' }), 'cancelled')
      expect(screen.getByRole('button', { name: 'Confirm status update' })).toBeEnabled()
    }
  )
  it('reports safe fallback for ordinary errors and remains recoverable', async () => {
    http.patch.mockRejectedValue(new Error('SQL connection password'))
    renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    await screen.findByRole('heading', { name: '#RF-10021' })
    await userEvent.click(screen.getByRole('button', { name: 'Update status' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Next status' }), 'cancelled')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm status update' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update the order status')
    expect(screen.queryByText('SQL connection password')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm status update' })).toBeEnabled()
  })
  it('communicates stale-transition failure while canonical refresh is pending and locks further writes', async () => {
    const { client } = renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    await screen.findByRole('heading', { name: '#RF-10021' })
    let resolve: (value: unknown) => void = () => {}
    http.patch.mockRejectedValue({ isAxiosError: true, response: { data: failure } })
    http.get.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    await userEvent.click(screen.getByRole('button', { name: 'Update status' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Next status' }), 'processing')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm status update' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(failure.message)
    expect(screen.getByRole('combobox', { name: 'Next status' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Confirm status update' })).toBeDisabled()
    expect(client.getQueryData(ordersKeys.detail(21))).toMatchObject({ status: 'confirmed' })
    await act(async () => resolve({ data: show }))
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Next status' })).toBeEnabled())
    expect(http.patch).toHaveBeenCalledTimes(1)
  })
  it('refreshes canonical detail and reports success when PATCH returns an evolved detail', async () => {
    http.patch.mockImplementation(async () => {
      canonical = { ...show, data: updated }
      return { data: { success: true, message: 'Saved', data: { id: 21 } } }
    })
    renderOrders(<OrderDetailPage />, '/dashboard/orders/21')
    await screen.findByRole('heading', { name: '#RF-10021' })
    await userEvent.click(screen.getByRole('button', { name: 'Update status' }))
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Next status' }), 'processing')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm status update' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(toast.success).toHaveBeenCalledWith('Saved')
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
