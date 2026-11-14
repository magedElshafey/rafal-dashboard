import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@/config/i18'
import OrderDetailPage from '../pages/OrderDetailPage'
import { normalizeOrderDetail } from '../utils/order-normalizers'
import { ordersKeys } from '../queries/orders.keys'
import { renderOrders } from './test-utils'
import { ordersService } from '../api/orders.service'
import guest159 from './order-159-confirmed.json'
import registered158 from './order-158-confirmed.json'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))

beforeEach(async () => {
  http.get.mockReset()
  http.patch.mockReset()
  await i18n.changeLanguage('en')
})

describe('nullable Order Details regressions', () => {
  it.each([guest159, registered158])('parses the exact HTTP response for $data.order_number', async (fixture) => {
    http.get.mockResolvedValue({ data: fixture })
    const order = await ordersService.show(fixture.data.id)
    const guest = fixture.data.id === 159
    expect(order).toMatchObject({
      id: guest ? 159 : 158,
      orderNumber: guest ? 'RF-10159' : 'RF-10158',
      status: 'confirmed',
      customer: fixture.data.customer,
      payment: { method: 'card', status: 'paid', reference: fixture.data.payment.reference },
    })
    expect(order.money).toEqual({
      subtotal: guest ? '640.00' : '120.00',
      discountTotal: '0.00',
      shippingFee: guest ? '149.00' : '15.00',
      personalizationTotal: guest ? '0.00' : '1.00',
      giftWrapFee: '0.00',
      taxableAmount: guest ? '789.00' : '136.00',
      vat: { rate: '15.00', amount: guest ? '118.35' : '20.40' },
      total: guest ? '907.35' : '156.40',
      currency: 'SAR',
    })
    expect(order.loyalty).toEqual({
      pointsEarned: guest ? 736 : 0,
      earnedStatus: null,
      availableOn: null,
      returnWindowDays: 1,
      pointsRedeemed: 0,
      amountApplied: '0.00',
      amountDue: guest ? '907.35' : '156.40',
      valuePerPoint: null,
      pointsReturned: 0,
      amountPerPoint: guest ? '1.00' : '150.00',
      ruleVersionId: guest ? 14 : 13,
    })
    expect(order.coupon).toBeNull()
    expect(order.cancelledAt).toBeNull()
    expect(order.statusHistory[0]).toMatchObject({ fromStatus: null, actorId: null, actorName: null })
    expect(order.statusHistory.map((entry) => entry.toStatus)).toEqual(
      guest ? ['new', 'pending_verification', 'confirmed'] : ['new', 'confirmed']
    )
    expect(order.allowedTransitions).toEqual(['processing', 'cancelled'])
    expect(order.items[0]).toMatchObject({
      id: guest ? 254 : 253,
      productName: fixture.data.items[0].product_name,
      variantSku: fixture.data.items[0].variant_sku,
      quantity: 1,
      unitPrice: guest ? '640.00' : '120.00',
      discountAmount: '0.00',
      lineTotal: guest ? '640.00' : '121.00',
    })
    expect(order.items[0].variantAttributes).toEqual(fixture === guest159 ? {} : { lenth: '60 cm' })
    expect(order.items[0].personalization).toEqual(
      fixture === guest159 ? null : { text: 'j', language: 'en', fee: '1.00' }
    )
    expect(http.get).toHaveBeenCalledExactlyOnceWith({
      url: `/dashboard/orders/${fixture.data.id}`,
      signal: undefined,
      suppressErrorNotification: true,
    })
  })

  it.each([guest159, registered158])('renders $data.order_number through HTTP, query and page', async (fixture) => {
    http.get.mockResolvedValue({ data: fixture })
    const { client } = renderOrders(<OrderDetailPage />, `/dashboard/orders/${fixture.data.id}`)
    expect(await screen.findByRole('heading', { name: fixture.data.display_number })).toBeInTheDocument()
    expect(client.getQueryData(ordersKeys.detail(fixture.data.id))).toEqual(normalizeOrderDetail(fixture.data))
    const guest = fixture.data.id === 159
    const fact = (region: string, label: string, value: string) => {
      const term = within(screen.getByRole('region', { name: region })).getByText(label, { selector: 'dt' })
      expect(term.nextElementSibling).toHaveTextContent(new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
    }
    fact('Order metadata', 'ID', guest ? '159' : '158')
    fact('Order metadata', 'Cancelled at', '—')
    fact('Money summary', 'Subtotal', guest ? '640.00 SAR' : '120.00 SAR')
    fact('Money summary', 'Shipping', guest ? '149.00 SAR' : '15.00 SAR')
    fact('Money summary', 'Personalization', guest ? '0.00 SAR' : '1.00 SAR')
    fact('Money summary', 'VAT amount', guest ? '118.35 SAR' : '20.40 SAR')
    fact('Money summary', 'Total', guest ? '907.35 SAR' : '156.40 SAR')
    fact('Loyalty earning', 'Points earned', guest ? '736' : '0')
    fact('Loyalty earning', 'Points redeemed', '0')
    fact('Loyalty earning', 'Points returned', '0')
    fact('Loyalty earning', 'Amount applied', '0.00 SAR')
    fact('Loyalty earning', 'Amount due', guest ? '907.35 SAR' : '156.40 SAR')
    fact('Loyalty earning', 'Amount per point', guest ? '1.00 SAR' : '150.00 SAR')
    fact('Loyalty earning', 'Rule version', guest ? '14' : '13')
    fact('Loyalty earning', 'Return window (days)', '1')
    for (const label of ['Earning status', 'Available on', 'Value per point']) fact('Loyalty earning', label, '—')
    const loyalty = within(screen.getByRole('region', { name: 'Loyalty earning' }))
    expect(loyalty.queryByText('Pending')).not.toBeInTheDocument()
    const customer = within(screen.getByRole('region', { name: 'Customer' }))
    expect(customer.getByText(fixture === guest159 ? 'Guest' : 'Registered')).toBeInTheDocument()
    const items = within(screen.getByRole('region', { name: 'Items' }))
    const itemRow = within(screen.getByRole('table', { name: 'Items' })).getAllByRole('row')[1]
    expect(
      within(itemRow)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    ).toEqual([
      expect.stringContaining(fixture.data.items[0].product_name),
      '1',
      guest ? '640.00 SAR' : '120.00 SAR',
      '0.00 SAR',
      guest ? '640.00 SAR' : '121.00 SAR',
    ])
    expect(items.getAllByText(fixture.data.items[0].variant_sku)).toHaveLength(2)
    if (fixture === registered158) {
      expect(customer.getAllByText('registered@example.test')).toHaveLength(2)
      for (const value of ['lenth', '60 cm', 'j', 'en', '1.00 SAR']) expect(items.getAllByText(value)).toHaveLength(2)
    } else {
      expect(customer.getByText('عبد الله بن عبد')).toBeInTheDocument()
      expect(itemRow.querySelector('dl')).toBeNull()
      expect(items.queryByText('Personalization text')).not.toBeInTheDocument()
      expect(items.queryByText('1.00 SAR')).not.toBeInTheDocument()
    }
    fact('Customer', 'Phone', fixture.data.customer.phone)
    fact('Shipping address', 'Recipient name', fixture.data.shipping_address.recipient_name)
    fact('Shipping address', 'Phone', fixture.data.shipping_address.recipient_phone)
    fact('Shipping address', 'City', 'الرياض')
    fact('Shipping address', 'District', fixture.data.shipping_address.district)
    fact('Shipping address', 'Street details', fixture.data.shipping_address.street_details)
    fact('Payment', 'Reference', fixture.data.payment.reference)
    expect(within(screen.getByRole('region', { name: 'Payment' })).getByText('Paid')).toBeInTheDocument()
    expect(screen.getByText('مخزن الرياض')).toBeInTheDocument()
    expect(screen.getByText('No coupon applied')).toBeInTheDocument()
    const history = within(screen.getByRole('region', { name: 'Status history' }))
    expect(history.getByText('Initial status:')).toBeInTheDocument()
    expect(history.getAllByText('System')).toHaveLength(guest ? 3 : 2)
    const events = history.getAllByRole('listitem')
    expect(events).toHaveLength(fixture.data.status_history.length)
    fixture.data.status_history.forEach((entry, index) => {
      expect(events[index]).toHaveTextContent(entry.note)
      expect(events[index].querySelector('time')).toHaveAttribute('dateTime', entry.created_at)
    })
    if (guest) expect(history.getByText('Pending verification')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update status' })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Update status' }))
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Select an allowed status',
      'Processing',
      'Cancelled',
    ])
    expect(http.patch).not.toHaveBeenCalled()
    expect(http.get).toHaveBeenCalledExactlyOnceWith({
      url: `/dashboard/orders/${fixture.data.id}`,
      signal: expect.any(AbortSignal),
      suppressErrorNotification: true,
    })
    expect(screen.queryByTestId('query-state-loading-error')).not.toBeInTheDocument()
  })

  it.each([null, undefined, ''])(
    'renders absent or empty loyalty status %s with zero points',
    async (earned_status) => {
      const fixture = {
        ...guest159,
        data: {
          ...guest159.data,
          loyalty: {
            ...guest159.data.loyalty,
            earned_status,
            points_earned: 0,
            value_per_point: undefined,
            available_on: undefined,
          },
        },
      }
      expect(normalizeOrderDetail(fixture.data).loyalty).toMatchObject({
        earnedStatus: null,
        valuePerPoint: null,
        pointsEarned: 0,
      })
      http.get.mockResolvedValue({ data: fixture })
      renderOrders(<OrderDetailPage />, '/dashboard/orders/159')
      const loyalty = within(await screen.findByRole('region', { name: 'Loyalty earning' }))
      await screen.findByRole('heading', { name: '#RF-10159' })
      expect(loyalty.getAllByText('0')).toHaveLength(3)
      expect(loyalty.getByText('907.35 SAR')).toBeInTheDocument()
    }
  )

  it('isolates missing and malformed display values without inventing data', async () => {
    const diagnostic = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const data = {
      ...guest159.data,
      display_number: undefined,
      customer: { type: 'guest', name: null },
      shipping_address: { recipient_name: { invalid: 'private' } },
      items: [{ ...guest159.data.items[0], variant_attributes: undefined }],
      status_history: [
        { ...guest159.data.status_history[0], note: undefined, actor_id: undefined, actor_name: undefined },
      ],
    }
    const order = normalizeOrderDetail(data)
    expect(order.customer).toEqual({ type: 'guest', name: '', email: null, phone: '' })
    expect(order.shippingAddress).toEqual({
      recipientName: '',
      recipientPhone: '',
      city: null,
      district: '',
      streetDetails: '',
    })
    expect(order.statusHistory[0]).toMatchObject({ note: null, actorId: null, actorName: null })
    http.get.mockResolvedValue({ data: { ...guest159, data } })
    renderOrders(<OrderDetailPage />, '/dashboard/orders/159')
    expect(await screen.findByRole('heading', { name: 'RF-10159' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Shipping address' })).getAllByText('—')).toHaveLength(5)
    expect(diagnostic).toHaveBeenCalledWith('Order details: invalid optional display text omitted')
    diagnostic.mockRestore()
  })

  it.each([
    { id: 0 },
    { order_number: '' },
    { status: null },
    { allowed_transitions: null },
    { money: { total: null } },
  ])('keeps invalid operational fields as controlled query failures: %j', async (override) => {
    const data = { ...guest159.data, ...override }
    expect(() => normalizeOrderDetail(data)).toThrow()
    http.get.mockResolvedValueOnce({ data: { ...guest159, data } }).mockResolvedValue({ data: guest159 })
    renderOrders(<OrderDetailPage />, '/dashboard/orders/159')
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Update status' })).not.toBeInTheDocument()
    expect(screen.queryByText(/ZodError|invalid_type/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: '#RF-10159' })).toBeInTheDocument()
  })
})
