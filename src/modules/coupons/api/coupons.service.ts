import type {
  Coupon,
  CouponCreatePayload,
  CouponResponse,
  CouponsIndexResponse,
  CouponUpdatePayload,
  DeleteCouponResponse,
  RawCoupon,
  RawCouponResponse,
} from '@/modules/coupons/types/coupon.types'
import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import { $http } from '@/utils/http'

function normalizeNumber(value: number | string, field: string): number {
  const normalized = Number(value)
  if (!Number.isFinite(normalized)) throw new Error(`Coupon ${field} is unavailable`)
  return normalized
}

function normalizeNullableNumber(value: number | string | null, field: string): number | null {
  return value === null ? null : normalizeNumber(value, field)
}

export function normalizeCoupon(raw: RawCoupon): Coupon {
  if (raw.type !== 'percent' && raw.type !== 'fixed') throw new Error('Coupon type is unavailable')
  return {
    id: raw.id,
    code: raw.code,
    name: { ...raw.name },
    description: { ...raw.description },
    type: raw.type,
    value: normalizeNumber(raw.value, 'value'),
    maxDiscountAmount:
      raw.type === 'percent' ? normalizeNullableNumber(raw.max_discount_amount, 'max discount amount') : null,
    minOrderAmount: normalizeNullableNumber(raw.min_order_amount, 'minimum order amount'),
    startsAt: raw.starts_at,
    endsAt: raw.ends_at,
    isPublic: Boolean(raw.is_public),
    isActive: Boolean(raw.is_active),
    usageLimitTotal: normalizeNullableNumber(raw.usage_limit_total, 'total usage limit'),
    usageLimitPerCustomer: normalizeNullableNumber(raw.usage_limit_per_customer, 'customer usage limit'),
    newCustomersOnly: Boolean(raw.new_customers_only),
    usagesCount: normalizeNumber(raw.usages_count, 'usage count'),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function serializeCouponCreate(payload: CouponCreatePayload) {
  return {
    code: payload.code.trim(),
    name: { ar: payload.name.ar.trim(), en: payload.name.en.trim() },
    description: { ...payload.description },
    type: payload.type,
    value: payload.value,
    ...(payload.type === 'percent' ? { max_discount_amount: payload.maxDiscountAmount } : {}),
    min_order_amount: payload.minOrderAmount,
    starts_at: payload.startsAt,
    ends_at: payload.endsAt,
    is_public: toApiBoolean(payload.isPublic),
    is_active: toApiBoolean(payload.isActive),
    usage_limit_total: payload.usageLimitTotal,
    usage_limit_per_customer: payload.usageLimitPerCustomer,
    new_customers_only: toApiBoolean(payload.newCustomersOnly),
  }
}

export function serializeCouponUpdate(payload: CouponUpdatePayload) {
  return {
    ...(payload.code !== undefined ? { code: payload.code.trim() } : {}),
    ...(payload.name !== undefined ? { name: { ...payload.name } } : {}),
    ...(payload.description !== undefined ? { description: { ...payload.description } } : {}),
    ...(payload.type !== undefined ? { type: payload.type } : {}),
    ...(payload.value !== undefined ? { value: payload.value } : {}),
    ...(payload.maxDiscountAmount !== undefined && payload.type !== 'fixed'
      ? { max_discount_amount: payload.maxDiscountAmount }
      : {}),
    ...(payload.minOrderAmount !== undefined ? { min_order_amount: payload.minOrderAmount } : {}),
    ...(payload.startsAt !== undefined ? { starts_at: payload.startsAt } : {}),
    ...(payload.endsAt !== undefined ? { ends_at: payload.endsAt } : {}),
    ...(payload.isPublic !== undefined ? { is_public: toApiBoolean(payload.isPublic) } : {}),
    ...(payload.isActive !== undefined ? { is_active: toApiBoolean(payload.isActive) } : {}),
    ...(payload.usageLimitTotal !== undefined ? { usage_limit_total: payload.usageLimitTotal } : {}),
    ...(payload.usageLimitPerCustomer !== undefined ? { usage_limit_per_customer: payload.usageLimitPerCustomer } : {}),
    ...(payload.newCustomersOnly !== undefined ? { new_customers_only: toApiBoolean(payload.newCustomersOnly) } : {}),
  }
}

function normalizeResponse(response: RawCouponResponse): CouponResponse {
  return { ...response, data: normalizeCoupon(response.data) }
}

export const couponsService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<Coupon>> {
    const response = (
      await $http.get<CouponsIndexResponse>({
        url: '/dashboard/coupons',
        query: { page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
    const items = response.data.map(normalizeCoupon)
    return {
      items,
      paginate: {
        current_page: response.meta.current_page,
        total_pages: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total,
        count: items.length,
        next_page_url:
          response.meta.current_page < response.meta.last_page ? String(response.meta.current_page + 1) : null,
        prev_page_url: response.meta.current_page > 1 ? String(response.meta.current_page - 1) : null,
      },
      extra: null,
    }
  },
  async create(payload: CouponCreatePayload) {
    const response = await $http.post<RawCouponResponse>({
      url: '/dashboard/coupons',
      data: serializeCouponCreate(payload),
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data)
  },
  async update(id: number, payload: CouponUpdatePayload) {
    const response = await $http.put<RawCouponResponse>({
      url: `/dashboard/coupons/${id}`,
      data: serializeCouponUpdate(payload),
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data)
  },
  async delete(id: number) {
    return (
      await $http.delete<DeleteCouponResponse>({
        url: `/dashboard/coupons/${id}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}
