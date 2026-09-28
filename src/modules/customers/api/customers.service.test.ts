import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  customersService,
  normalizeCustomerDetail,
  normalizeCustomerListItem,
  normalizeCustomerOrder,
} from '@/modules/customers/api/customers.service'
import type {
  RawCustomerDetail,
  RawCustomerListItem,
  RawCustomerOrderListItem,
} from '@/modules/customers/types/customer.types'

const rawCustomer: RawCustomerListItem = {
  id: 6,
  name: '',
  email: 'customer@example.com',
  phone: null,
  first_name: 'Maged',
  last_name: 'Elshafey',
  status: 'active',
  is_blocked: false,
  blocked_at: null,
  blocked_reason: null,
  orders_count: 0,
  lifetime_spend: '277.50',
  created_at: '2026-09-26T18:43:40+00:00',
  updated_at: '2026-09-26T18:44:59+00:00',
}

const rawDetail: RawCustomerDetail = {
  id: 6,
  name: '',
  email: 'customer@example.com',
  phone: null,
  first_name: null,
  last_name: null,
  terms_accepted_at: '2026-09-26T18:44:59+00:00',
  marketing_opt_in: false,
  status: 'future-customer-status',
  is_blocked: true,
  blocked_at: null,
  blocked_reason: null,
  addresses_count: 0,
  created_at: '2026-09-26T18:43:40+00:00',
  updated_at: '2026-09-26T18:44:59+00:00',
}

const rawOrder: RawCustomerOrderListItem = {
  id: 64,
  order_number: 'RF-10064',
  display_number: '#RF-10064',
  status: 'future-order-status',
  customer: { type: 'registered', name: null, email: null, phone: null },
  items_count: 0,
  total: '277.50',
  currency: 'SAR',
  payment_status: 'future-payment-status',
  is_gift: true,
  placed_at: null,
}

describe('customersService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GETs the exact Customer Index endpoint with only pagination', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [rawCustomer],
        meta: { current_page: 2, last_page: 3, per_page: 15, total: 31 },
      },
    })

    const result = await customersService.list(2, signal)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/customers',
      query: { page: 2 },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.items[0]).toMatchObject({
      id: 6,
      firstName: 'Maged',
      lastName: 'Elshafey',
      isBlocked: false,
      lifetimeSpend: 277.5,
    })
  })

  it('GETs and normalizes the authoritative Customer Detail endpoint', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: rawDetail } })

    await expect(customersService.show(6, signal)).resolves.toMatchObject({
      id: 6,
      phone: null,
      firstName: null,
      lastName: null,
      isBlocked: true,
      blockedAt: null,
      blockedReason: null,
      status: 'future-customer-status',
    })
    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/customers/6',
      signal,
      suppressErrorNotification: true,
    })
  })

  it('GETs Customer Orders independently with only pagination and tolerant statuses', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [rawOrder],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 1 },
      },
    })

    const result = await customersService.orders(6, 1, signal)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/customers/6/orders',
      query: { page: 1 },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.items[0]).toMatchObject({
      total: 277.5,
      placedAt: null,
      status: 'future-order-status',
      paymentStatus: 'future-payment-status',
    })
  })

  it('POSTs exact block and unblock endpoints without a meaningful body', async () => {
    httpMocks.post.mockResolvedValue({ data: { success: true } })

    await customersService.block(6)
    await customersService.unblock(6)

    expect(httpMocks.post.mock.calls).toEqual([
      [
        {
          url: '/dashboard/customers/6/block',
          suppressSuccessNotification: true,
          suppressErrorNotification: true,
        },
      ],
      [
        {
          url: '/dashboard/customers/6/unblock',
          suppressSuccessNotification: true,
          suppressErrorNotification: true,
        },
      ],
    ])
    expect(httpMocks.post.mock.calls.every(([request]) => !('data' in request))).toBe(true)
  })

  it('rejects non-finite monetary values at normalization', () => {
    expect(() => normalizeCustomerListItem({ ...rawCustomer, lifetime_spend: 'not-a-number' })).toThrow(
      'Customer lifetime spend is unavailable'
    )
    expect(() => normalizeCustomerOrder({ ...rawOrder, total: 'Infinity' })).toThrow('Order total is unavailable')
    expect(() => normalizeCustomerDetail({ ...rawDetail, addresses_count: Number.NaN })).toThrow(
      'Customer addresses count is unavailable'
    )
  })
})
