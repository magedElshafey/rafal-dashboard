import { z } from 'zod'
import { $http } from '@/utils/http'
import { successEnvelopeSchema, paginationSchema, failureEnvelopeSchema } from '../schemas/order.schema'
import { normalizeOrderDetail, normalizeOrderListItem, normalizeOrderStatus } from '../utils/order-normalizers'
import { serializeOrdersFilters } from '../utils/order-filters'
import type { OrderDetail, OrderListItem, OrdersFilters } from '../types/order.types'

export class OrderTransitionError extends Error {
  constructor(
    public readonly feedback: { message?: string; errors?: { status?: string[]; allowed_transitions?: string[] } }
  ) {
    super('Order transition rejected')
  }
}
export const ordersService = {
  async statuses(signal?: AbortSignal) {
    const response = await $http.get({ url: '/dashboard/orders/statuses', signal, suppressErrorNotification: true })
    const envelope = successEnvelopeSchema.parse(response.data)
    return z.array(z.unknown()).parse(envelope.data).map(normalizeOrderStatus)
  },
  async list(filters: OrdersFilters, page = 1, signal?: AbortSignal): Promise<PaginatedData<OrderListItem>> {
    const response = await $http.get({
      url: '/dashboard/orders',
      query: { ...serializeOrdersFilters(filters), page },
      signal,
      suppressErrorNotification: true,
    })
    const envelope = successEnvelopeSchema.extend({ meta: paginationSchema }).parse(response.data)
    const items = z.array(z.unknown()).parse(envelope.data).map(normalizeOrderListItem)
    const meta = envelope.meta
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
  },
  async show(id: number, signal?: AbortSignal) {
    z.number().int().positive().safe().parse(id)
    const response = await $http.get({ url: `/dashboard/orders/${id}`, signal, suppressErrorNotification: true })
    const detail = normalizeOrderDetail(successEnvelopeSchema.parse(response.data).data)
    if (detail.id !== id) throw new Error('Order identity mismatch')
    return detail
  },
  async updateStatus(id: number, status: string): Promise<{ message?: string; detail: OrderDetail | null }> {
    z.number().int().positive().safe().parse(id)
    z.string().trim().min(1).parse(status)
    const response = await $http.patch({
      url: `/dashboard/orders/${id}/status`,
      data: { status },
      suppressErrorNotification: true,
      suppressSuccessNotification: true,
      suppressForbiddenRedirect: true,
    })
    const failure = failureEnvelopeSchema.extend({ success: z.literal(false) }).safeParse(response.data)
    if (failure.success) throw new OrderTransitionError(failure.data)
    const envelope = successEnvelopeSchema.parse(response.data)
    // A persisted success remains a success even if optional returned detail evolves.
    let detail: OrderDetail | null = null
    try {
      const parsed = normalizeOrderDetail(envelope.data)
      if (parsed.id === id) detail = parsed
    } catch {
      /* Canonical Show is refreshed by the mutation hook. */
    }
    return { message: envelope.message?.trim() || undefined, detail }
  },
}
