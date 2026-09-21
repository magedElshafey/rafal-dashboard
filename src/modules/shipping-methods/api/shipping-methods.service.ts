import env from '@/config/env'
import { shippingMethodsMockTransport } from '@/modules/shipping-methods/mocks/shipping-methods.mock'
import type {
  DeleteShippingMethodResponse,
  RawShippingMethod,
  RawShippingMethodResponse,
  ShippingMethod,
  ShippingMethodCreatePayload,
  ShippingMethodResponse,
  ShippingMethodsIndexResponse,
  ShippingMethodUpdatePayload,
} from '@/modules/shipping-methods/types/shipping-method.types'
import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import { $http } from '@/utils/http'

function assertPickupPrice(payload: { isPickup?: boolean; price?: number }) {
  if (payload.isPickup === true && payload.price !== 0) {
    throw new Error('Pickup shipping methods must include a zero price')
  }
}

export function serializeShippingMethodCreate(payload: ShippingMethodCreatePayload) {
  assertPickupPrice(payload)
  const body = new FormData()
  body.set('code', payload.code.trim())
  body.set('name[ar]', payload.name.ar.trim())
  body.set('name[en]', payload.name.en.trim())
  body.set('eta_label[ar]', payload.etaLabel.ar.trim())
  body.set('eta_label[en]', payload.etaLabel.en.trim())
  body.set('is_pickup', String(toApiBoolean(payload.isPickup)))
  body.set('price', String(payload.price))
  if (payload.sortOrder !== null) body.set('sort_order', String(payload.sortOrder))
  body.set('is_active', String(toApiBoolean(payload.isActive)))
  return body
}

export function serializeShippingMethodUpdate(payload: ShippingMethodUpdatePayload) {
  assertPickupPrice(payload)
  const body = new FormData()
  if (payload.code !== undefined) body.set('code', payload.code.trim())
  if (payload.nameAr !== undefined) body.set('name[ar]', payload.nameAr.trim())
  if (payload.nameEn !== undefined) body.set('name[en]', payload.nameEn.trim())
  if (payload.etaLabelAr !== undefined) body.set('eta_label[ar]', payload.etaLabelAr.trim())
  if (payload.etaLabelEn !== undefined) body.set('eta_label[en]', payload.etaLabelEn.trim())
  if (payload.isPickup !== undefined) body.set('is_pickup', String(toApiBoolean(payload.isPickup)))
  if (payload.price !== undefined) body.set('price', String(payload.price))
  if (payload.sortOrder !== undefined) body.set('sort_order', String(payload.sortOrder))
  if (payload.isActive !== undefined) body.set('is_active', String(toApiBoolean(payload.isActive)))
  return body
}

export function normalizeShippingMethod(raw: RawShippingMethod): ShippingMethod {
  const price = Number(raw.price)
  if (!Number.isFinite(price)) throw new Error('Shipping method price is unavailable')
  return {
    id: raw.id,
    code: raw.code,
    name: { ...raw.name },
    etaLabel: { ...raw.eta_label },
    price,
    isPickup: raw.is_pickup,
    isActive: raw.is_active,
    sortOrder: raw.sort_order,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function normalizeResponse(response: RawShippingMethodResponse): ShippingMethodResponse {
  return { ...response, data: normalizeShippingMethod(response.data) }
}

export const shippingMethodsHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    return (
      await $http.get<ShippingMethodsIndexResponse>({
        url: '/dashboard/shipping-methods',
        query: { page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
  },
  async create(body: FormData) {
    return (
      await $http.post<RawShippingMethodResponse>({
        url: '/dashboard/shipping-methods',
        data: body,
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async update(id: number, body: FormData) {
    return (
      await $http.put<RawShippingMethodResponse>({
        url: `/dashboard/shipping-methods/${id}`,
        data: body,
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async delete(id: number) {
    return (
      await $http.delete<DeleteShippingMethodResponse>({
        url: `/dashboard/shipping-methods/${id}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}

const transport = env.SHIPPING_METHODS_USE_MOCK ? shippingMethodsMockTransport : shippingMethodsHttpTransport

export const shippingMethodsService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<ShippingMethod>> {
    const response = await transport.list(page, signal)
    const items = response.data.map(normalizeShippingMethod)
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
  async create(payload: ShippingMethodCreatePayload) {
    return normalizeResponse(await transport.create(serializeShippingMethodCreate(payload)))
  },
  async update(id: number, payload: ShippingMethodUpdatePayload) {
    return normalizeResponse(await transport.update(id, serializeShippingMethodUpdate(payload)))
  },
  delete: (id: number) => transport.delete(id),
}
