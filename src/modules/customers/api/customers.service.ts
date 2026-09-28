import type {
  CustomerDetail,
  CustomerDetailResponse,
  CustomerOrderListItem,
  CustomerOrdersIndexResponse,
  CustomerListItem,
  CustomersIndexResponse,
  RawCustomerDetail,
  RawCustomerListItem,
  RawCustomerOrderListItem,
} from '@/modules/customers/types/customer.types'
import { $http } from '@/utils/http'

function normalizeId(value: number, entity: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${entity} ID is unavailable`)
  return value
}

function normalizeCount(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${field} is unavailable`)
  return value
}

function normalizeNumericAmount(value: number | string, field: string): number {
  const normalized = typeof value === 'number' ? value : Number(value.trim())
  if (!Number.isFinite(normalized)) throw new Error(`${field} is unavailable`)
  return normalized
}

function normalizeBoolean(value: boolean | 0 | 1): boolean {
  return value === true || value === 1
}

export function normalizeCustomerListItem(raw: RawCustomerListItem): CustomerListItem {
  return {
    id: normalizeId(raw.id, 'Customer'),
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    firstName: raw.first_name,
    lastName: raw.last_name,
    status: raw.status,
    isBlocked: normalizeBoolean(raw.is_blocked),
    blockedAt: raw.blocked_at,
    blockedReason: raw.blocked_reason,
    ordersCount: normalizeCount(raw.orders_count, 'Customer orders count'),
    lifetimeSpend: normalizeNumericAmount(raw.lifetime_spend, 'Customer lifetime spend'),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function normalizeCustomerDetail(raw: RawCustomerDetail): CustomerDetail {
  return {
    id: normalizeId(raw.id, 'Customer'),
    name: raw.name,
    email: raw.email,
    phone: raw.phone,
    firstName: raw.first_name,
    lastName: raw.last_name,
    termsAcceptedAt: raw.terms_accepted_at,
    marketingOptIn: normalizeBoolean(raw.marketing_opt_in),
    status: raw.status,
    isBlocked: normalizeBoolean(raw.is_blocked),
    blockedAt: raw.blocked_at,
    blockedReason: raw.blocked_reason,
    addressesCount: normalizeCount(raw.addresses_count, 'Customer addresses count'),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function normalizeCustomerOrder(raw: RawCustomerOrderListItem): CustomerOrderListItem {
  return {
    id: normalizeId(raw.id, 'Order'),
    orderNumber: raw.order_number,
    displayNumber: raw.display_number,
    status: raw.status,
    itemsCount: normalizeCount(raw.items_count, 'Order items count'),
    total: normalizeNumericAmount(raw.total, 'Order total'),
    currency: raw.currency,
    paymentStatus: raw.payment_status,
    isGift: normalizeBoolean(raw.is_gift),
    placedAt: raw.placed_at,
  }
}

function toPaginatedData<T>(
  items: T[],
  meta: { current_page: number; last_page: number; per_page: number; total: number }
): PaginatedData<T> {
  return {
    items,
    paginate: {
      current_page: meta.current_page,
      total_pages: meta.last_page,
      per_page: meta.per_page,
      total: meta.total,
      count: items.length,
      next_page_url: meta.current_page < meta.last_page ? String(meta.current_page + 1) : null,
      prev_page_url: meta.current_page > 1 ? String(meta.current_page - 1) : null,
    },
    extra: null,
  }
}

export const customersService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<CustomerListItem>> {
    const response = (
      await $http.get<CustomersIndexResponse>({
        url: '/dashboard/customers',
        query: { page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
    return toPaginatedData(response.data.map(normalizeCustomerListItem), response.meta)
  },

  async show(id: number, signal?: AbortSignal): Promise<CustomerDetail> {
    const response = await $http.get<CustomerDetailResponse>({
      url: `/dashboard/customers/${id}`,
      signal,
      suppressErrorNotification: true,
    })
    return normalizeCustomerDetail(response.data.data)
  },

  async orders(id: number, page: number, signal?: AbortSignal): Promise<PaginatedData<CustomerOrderListItem>> {
    const response = (
      await $http.get<CustomerOrdersIndexResponse>({
        url: `/dashboard/customers/${id}/orders`,
        query: { page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
    return toPaginatedData(response.data.map(normalizeCustomerOrder), response.meta)
  },

  async block(id: number): Promise<void> {
    await $http.post({
      url: `/dashboard/customers/${id}/block`,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  },

  async unblock(id: number): Promise<void> {
    await $http.post({
      url: `/dashboard/customers/${id}/unblock`,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  },
}
