import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  normalizeCoupon,
  serializeCouponCreate,
  serializeCouponUpdate,
  couponsService,
} from '@/modules/coupons/api/coupons.service'
import type { CouponCreatePayload, CouponUpdatePayload, RawCoupon } from '@/modules/coupons/types/coupon.types'
import { emptyCouponsFilters } from '@/modules/coupons/utils/coupon-filters'

const rawCoupon: RawCoupon = {
  id: 1,
  code: 'WELCOME',
  name: { ar: 'ترحيب', en: 'Welcome' },
  description: { ar: null, en: 'First order' },
  type: 'percent',
  value: '10',
  max_discount_amount: '150',
  min_order_amount: null,
  starts_at: null,
  ends_at: '2026-10-01T00:00:00Z',
  is_public: 1,
  is_active: true,
  usage_limit_total: null,
  usage_limit_per_customer: '1',
  new_customers_only: 1,
  usages_count: '3',
  created_at: '2026-09-28T00:00:00Z',
  updated_at: '2026-09-28T00:00:00Z',
}

const createPayload: CouponCreatePayload = {
  code: ' WELCOME ',
  name: { ar: ' ترحيب ', en: ' Welcome ' },
  description: { ar: null, en: 'First order' },
  type: 'percent',
  value: 10,
  maxDiscountAmount: 150,
  minOrderAmount: null,
  startsAt: null,
  endsAt: '2026-10-01T00:00:00.000Z',
  isPublic: true,
  isActive: false,
  usageLimitTotal: null,
  usageLimitPerCustomer: 1,
  newCustomersOnly: true,
}

const updatePayload: CouponUpdatePayload = {
  ...createPayload,
  startsAt: '2026-10-01 10:30:00',
  endsAt: null,
}

describe('couponsService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses the paginated Index endpoint with only the page parameter and normalizes the response', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [rawCoupon],
        meta: { current_page: 2, last_page: 3, per_page: 15, total: 31 },
      },
    })
    const result = await couponsService.list(2, signal)
    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/coupons',
      query: { page: 2 },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.paginate).toMatchObject({ current_page: 2, total_pages: 3, per_page: 15, total: 31 })
    expect(result.items[0]).toMatchObject({
      value: 10,
      maxDiscountAmount: 150,
      minOrderAmount: null,
      isPublic: true,
      isActive: true,
      usageLimitPerCustomer: 1,
      usagesCount: 3,
      name: rawCoupon.name,
      description: rawCoupon.description,
    })
  })

  it('sends supported Index filters server-side and preserves false', async () => {
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
      },
    })
    const signal = new AbortController().signal
    await couponsService.list(1, signal, {
      ...emptyCouponsFilters,
      type: 'fixed',
      isCurrentlyValid: false,
      dateFrom: '2026-10-01',
      dateTo: '2026-10-09',
      sortBy: 'is_active',
      sortDir: 'desc',
    })
    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/coupons',
      query: {
        type: 'fixed',
        is_currently_valid: 0,
        date_from: '2026-10-01',
        date_to: '2026-10-09',
        sort_by: 'is_active',
        sort_dir: 'desc',
        page: 1,
      },
      signal,
      suppressErrorNotification: true,
    })
  })

  it('normalizes fixed Coupons without surfacing a legacy max discount', () => {
    expect(normalizeCoupon({ ...rawCoupon, type: 'fixed', max_discount_amount: 999 })).toMatchObject({
      type: 'fixed',
      value: 10,
      maxDiscountAmount: null,
    })
  })

  it('uses JSON objects for exact Create and full Update writes with numeric booleans', async () => {
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'created', data: rawCoupon } })
    httpMocks.put.mockResolvedValue({ data: { success: true, message: 'updated', data: rawCoupon } })
    await couponsService.create(createPayload)
    await couponsService.update(1, updatePayload)

    expect(httpMocks.post).toHaveBeenCalledWith({
      url: '/dashboard/coupons',
      data: serializeCouponCreate(createPayload),
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect(httpMocks.post.mock.calls[0][0].data).not.toBeInstanceOf(FormData)
    expect(httpMocks.post.mock.calls[0][0].data).toMatchObject({
      code: 'WELCOME',
      is_public: 1,
      is_active: 0,
      new_customers_only: 1,
      max_discount_amount: 150,
    })
    expect(httpMocks.put).toHaveBeenCalledWith({
      url: '/dashboard/coupons/1',
      data: {
        code: 'WELCOME',
        name: { ar: 'ترحيب', en: 'Welcome' },
        description: { ar: null, en: 'First order' },
        type: 'percent',
        value: 10,
        max_discount_amount: 150,
        min_order_amount: null,
        starts_at: '2026-10-01 10:30:00',
        ends_at: null,
        is_public: 1,
        is_active: 0,
        usage_limit_total: null,
        usage_limit_per_customer: 1,
        new_customers_only: 1,
      },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect(httpMocks.put.mock.calls[0][0].data).not.toBeInstanceOf(FormData)
  })

  it('keeps Create unchanged while a full fixed Update sends canonical null max discount', async () => {
    const fixed = { ...createPayload, type: 'fixed' as const, maxDiscountAmount: null }
    expect(serializeCouponCreate(fixed)).not.toHaveProperty('max_discount_amount')
    expect(serializeCouponUpdate(fixed)).toMatchObject({
      code: 'WELCOME',
      type: 'fixed',
      value: 10,
      max_discount_amount: null,
      min_order_amount: null,
      is_active: 0,
      usage_limit_total: null,
    })
  })

  it('sends Delete without a body', async () => {
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
    await couponsService.delete(9)
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/coupons/9',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
