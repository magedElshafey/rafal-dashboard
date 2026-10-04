import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { ordersService } from '../api/orders.service'
import { normalizeOrderDetail, normalizeOrderListItem } from '../utils/order-normalizers'
import { attributesSchema } from '../schemas/order.schema'
import { customerLabel, orderStatusLabel, orderMoneyLabel } from '../utils/order-presentation'
import { emptyOrdersFilters } from '../utils/order-filters'
import { orderTransitionFeedback } from '../utils/order-errors'
import show from './order-detail.fixture.json'
import index from './orders-index.fixture.json'
import statuses from './statuses.fixture.json'
import { cancelledOrder20, confirmedOrder18, processingOrder19 } from './order-detail-runtime.fixtures'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
beforeEach(() => {
  vi.clearAllMocks()
})

describe('real Orders read contracts', () => {
  it('GETs the first Index page and normalizes all fields and pagination', async () => {
    http.get.mockResolvedValue({ data: index })
    const signal = new AbortController().signal
    const result = await ordersService.list(emptyOrdersFilters, 1, signal)
    expect(http.get).toHaveBeenCalledWith({
      url: '/dashboard/orders',
      query: { page: 1 },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.items).toEqual([
      {
        id: 21,
        orderNumber: 'RF-10021',
        displayNumber: '#RF-10021',
        status: 'confirmed',
        customer: index.data[0].customer,
        itemsCount: 1,
        total: '4003.13',
        currency: 'SAR',
        paymentStatus: 'paid',
        isGift: false,
        warehouse: { id: 2, name: 'Jeddah West Warehouse' },
        placedAt: '2026-10-04T05:27:15+00:00',
      },
    ])
    expect(result.paginate).toEqual({
      current_page: 1,
      total_pages: 2,
      per_page: 15,
      total: 21,
      count: 1,
      next_page_url: '2',
      prev_page_url: null,
    })
    http.get.mockResolvedValue({ data: { ...index, meta: { ...index.meta, current_page: 2 } } })
    expect((await ordersService.list(emptyOrdersFilters, 2)).paginate.next_page_url).toBeNull()
  })
  it('normalizes the EXACT supplied Show, including nested VAT and history', async () => {
    http.get.mockResolvedValue({ data: show })
    const detail = await ordersService.show(21)
    expect(http.get).toHaveBeenCalledWith(expect.objectContaining({ url: '/dashboard/orders/21' }))
    expect(detail).toEqual({
      id: 21,
      orderNumber: 'RF-10021',
      displayNumber: '#RF-10021',
      status: 'confirmed',
      customer: show.data.customer,
      warehouse: show.data.warehouse,
      placedAt: show.data.placed_at,
      shippingAddress: {
        recipientName: 'maged elshafey',
        recipientPhone: '0551234567',
        city: { id: 4, name: 'Makkah' },
        district: 'Tenetur consectetur',
        streetDetails: 'الهايشة',
      },
      items: [
        {
          id: 32,
          productName: 'montag 1',
          variantSku: 'RAF-dcb-3086232',
          variantAttributes: { color: '#03C4DD' },
          quantity: 3,
          unitPrice: '1062.50',
          discountAmount: '0.00',
          lineTotal: '3187.50',
          personalization: null,
        },
      ],
      money: {
        subtotal: '3187.50',
        discountTotal: '0.00',
        shippingFee: '0.00',
        personalizationTotal: '0.00',
        giftWrapFee: '15.00',
        taxableAmount: '3202.50',
        vat: { rate: '25.00', amount: '800.63' },
        total: '4003.13',
        currency: 'SAR',
      },
      coupon: null,
      payment: {
        method: 'card',
        status: 'paid',
        reference: show.data.payment.reference,
        paidAt: show.data.payment.paid_at,
      },
      statusHistory: show.data.status_history.map((entry) => ({
        fromStatus: entry.from_status,
        toStatus: entry.to_status,
        note: entry.note,
        actorType: entry.actor_type,
        actorId: entry.actor_id,
        actorName: entry.actor_name,
        createdAt: entry.created_at,
      })),
      allowedTransitions: ['processing', 'cancelled'],
      cancelledAt: null,
      createdAt: show.data.created_at,
      updatedAt: show.data.updated_at,
      gift: null,
    })
    expect(detail.statusHistory).toHaveLength(3)
  })
  it('accepts pending and future payment values, null warehouse and numeric booleans', () => {
    for (const payment_status of ['pending', 'future_value']) {
      expect(
        normalizeOrderListItem({ ...index.data[0], payment_status, is_gift: 1, warehouse: null, placed_at: null })
      ).toMatchObject({ paymentStatus: payment_status, isGift: true, warehouse: null, placedAt: null })
    }
    expect(normalizeOrderListItem({ ...index.data[0], is_gift: 0 }).isGift).toBe(false)
  })
  it('uses registered customer name → email → phone → localized fallback', () => {
    const customer = { type: 'registered', name: ' ', email: 'a@example.test', phone: '123' }
    expect(customerLabel(customer, 'Unavailable')).toBe('a@example.test')
    expect(customerLabel({ ...customer, email: '' }, 'Unavailable')).toBe('123')
    expect(customerLabel({ ...customer, email: '', phone: '' }, 'غير متاح')).toBe('غير متاح')
  })
  it.each([
    { id: 0 },
    { id: 1.5 },
    { items_count: -1 },
    { total: null },
    { total: 'NaN' },
    { currency: '' },
    { status: '' },
    { payment_status: '' },
    { is_gift: 'false' },
    { warehouse: {} },
  ])('rejects malformed critical Index fields %j', (override) => {
    expect(() => normalizeOrderListItem({ ...index.data[0], ...override })).toThrow()
  })
  it('rejects malformed detail money, quantities and mismatched identity', async () => {
    expect(() =>
      normalizeOrderDetail({ ...show.data, money: { ...show.data.money, vat: { rate: null, amount: '2' } } })
    ).toThrow()
    expect(() => normalizeOrderDetail({ ...show.data, items: [{ ...show.data.items[0], quantity: 0 }] })).toThrow()
    http.get.mockResolvedValue({ data: show })
    await expect(ordersService.show(22)).rejects.toThrow()
    await expect(ordersService.show(-1)).rejects.toThrow()
  })
  it('isolates optional display fields and unknown coupon shapes', () => {
    const detail = normalizeOrderDetail({
      ...show.data,
      coupon: { unknown: 'unconfirmed' },
      payment: { ...show.data.payment, reference: {} },
    })
    expect(detail.payment.reference).toBeNull()
    expect(detail.coupon).toEqual({ unknown: 'unconfirmed' })
    expect(detail.gift).toBeNull()
  })
  it('preserves arbitrary and Unicode attribute keys exactly and rejects dangerous/nested data', () => {
    const attributes = { color: '#03C4DD', stone_type: 'Diamond', تيست_تيست_تيست: '11117', 'Mixed Key': 'value' }
    expect(attributesSchema.parse(attributes)).toEqual(attributes)
    expect(attributesSchema.parse({ color: 'red' })).toEqual({ color: 'red' })
    for (const value of [
      { key: {} },
      { key: [] },
      { key: 2 },
      { constructor: 'x' },
      { prototype: 'x' },
      JSON.parse('{"__proto__":"x"}'),
    ])
      expect(attributesSchema.safeParse(value).success).toBe(false)
    expect(Object.prototype).not.toHaveProperty('polluted')
  })
  it('normalizes only the confirmed empty-array compatibility shape for variant attributes', () => {
    expect(attributesSchema.parse([])).toEqual({})
    expect(attributesSchema.parse({})).toEqual({})
    expect(attributesSchema.parse({ size: 'S' })).toEqual({ size: 'S' })
    expect(attributesSchema.parse({ color: 'gold' })).toEqual({ color: 'gold' })
    expect(attributesSchema.safeParse(['invalid']).success).toBe(false)
    expect(attributesSchema.safeParse([{ size: 'M' }]).success).toBe(false)
  })
  it.each([
    [18, 'confirmed', confirmedOrder18],
    [19, 'processing', processingOrder19],
    [20, 'cancelled', cancelledOrder20],
  ])('normalizes real Order %i in %s state through the Show service', async (id, status, response) => {
    http.get.mockResolvedValue({ data: response })
    const detail = await ordersService.show(id)
    expect(detail).toMatchObject({ id, status })
    expect(detail.items.every((item) => !Array.isArray(item.variantAttributes))).toBe(true)
  })
  it('preserves optional item personalization and rejects malformed confirmed shapes', () => {
    const detail = normalizeOrderDetail(cancelledOrder20.data)
    expect(detail.items[0].personalization).toBeNull()
    expect(detail.items[1].personalization).toEqual({ text: 'توتا', language: 'ar', fee: '19.84' })
    expect(detail.items[4].personalization).toEqual({ text: 'تيست', language: 'ar', fee: '11.48' })
    expect(() =>
      normalizeOrderDetail({
        ...confirmedOrder18.data,
        items: [
          {
            ...confirmedOrder18.data.items[0],
            personalization: { text: 'x', language: 'ar', fee: 19.84 },
          },
        ],
      })
    ).toThrow()
    expect(() =>
      normalizeOrderDetail({
        ...confirmedOrder18.data,
        items: [{ ...confirmedOrder18.data.items[0], personalization: ['invalid'] }],
      })
    ).toThrow()
  })
  it('preserves financial precision and backend currency without recomputation', () => {
    expect(orderMoneyLabel('9007199254740993.123', 'USD', 'en')).toBe('9,007,199,254,740,993.123 USD')
  })
})

describe('status metadata', () => {
  it('GETs the authoritative endpoint and preserves all nine labels and groups', async () => {
    http.get.mockResolvedValue({ data: statuses })
    const definitions = await ordersService.statuses()
    expect(http.get).toHaveBeenCalledWith(expect.objectContaining({ url: '/dashboard/orders/statuses' }))
    expect(definitions).toEqual(
      statuses.data.map((item) => ({ value: item.value, label: item.label, customerStatus: item.customer_status }))
    )
    expect(definitions.map((item) => item.value)).toEqual([
      'new',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'returned',
      'cancelled',
      'payment_failed',
      'pending_verification',
    ])
  })
  it('reads unknown status labels and translates known Arabic values', async () => {
    http.get.mockResolvedValue({
      data: { success: true, data: [{ value: 'future_status', label: 'Future label', customer_status: 'future' }] },
    })
    const definitions = await ordersService.statuses()
    await i18n.changeLanguage('ar')
    expect(orderStatusLabel('confirmed', definitions, i18n.t)).toBe('مؤكد')
    expect(orderStatusLabel('future_status', definitions, i18n.t)).toBe('Future label')
    expect(orderStatusLabel('other_future', definitions, i18n.t)).toBe('other future')
  })
})

describe('status mutation envelopes', () => {
  it('PATCHes only status and accepts the current success detail/history/transitions', async () => {
    const data = {
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
    http.patch.mockResolvedValue({ data: { success: true, message: 'Order status updated successfully', data } })
    const result = await ordersService.updateStatus(21, 'processing')
    expect(http.patch).toHaveBeenCalledWith({
      url: '/dashboard/orders/21/status',
      data: { status: 'processing' },
      suppressErrorNotification: true,
      suppressSuccessNotification: true,
      suppressForbiddenRedirect: true,
    })
    expect(result.detail).toMatchObject({ status: 'processing', allowedTransitions: ['shipped', 'cancelled'] })
    expect(result.detail?.statusHistory.at(-1)).toMatchObject({
      actorName: 'Super Admin',
      fromStatus: 'confirmed',
      toStatus: 'processing',
    })
  })
  it('keeps persisted success successful even when returned detail evolves', async () => {
    http.patch.mockResolvedValue({ data: { success: true, message: 'Saved', data: { id: 21 } } })
    await expect(ordersService.updateStatus(21, 'processing')).resolves.toEqual({ message: 'Saved', detail: null })
    http.patch.mockResolvedValue({ data: { success: true, message: { unexpected: true }, data: null } })
    await expect(ordersService.updateStatus(21, 'processing')).resolves.toEqual({ message: undefined, detail: null })
  })
  it('handles real resolved failure and never turns allowed transitions into error text', async () => {
    http.patch.mockResolvedValue({
      data: {
        success: false,
        message: 'Cannot transition order from confirmed to delivered',
        errors: {
          status: ['Cannot transition order from confirmed to delivered'],
          allowed_transitions: ['processing', 'cancelled'],
        },
      },
    })
    try {
      await ordersService.updateStatus(21, 'delivered')
      throw new Error('Expected failure')
    } catch (error) {
      expect(orderTransitionFeedback(error, 'Fallback')).toEqual({
        message: 'Cannot transition order from confirmed to delivered',
        statusError: 'Cannot transition order from confirmed to delivered',
        stale: true,
      })
    }
    expect(orderTransitionFeedback(new Error('SQL internal stack'), 'Fallback').message).toBe('Fallback')
    expect(
      orderTransitionFeedback({ isAxiosError: true, response: { data: { message: { unsafe: 'nested' } } } }, 'Fallback')
        .message
    ).toBe('Fallback')
  })
})
