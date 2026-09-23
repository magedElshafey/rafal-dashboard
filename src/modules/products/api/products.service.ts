import env from '@/config/env'
import { productsMockTransport } from '@/modules/products/mocks/products.mock'
import { normalizeProductVariant } from '@/modules/products/api/product-variants.service'
import type {
  ProductCreatePayload,
  ProductCreateResponse,
  ProductDetail,
  ProductDeleteResponse,
  ProductListItem,
  ProductUpdatePayload,
  ProductsIndexResponse,
  RawProductDetail,
  RawProductDetailResponse,
  RawProductListItem,
} from '@/modules/products/types/product.types'
import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import { $http } from '@/utils/http'

function appendOptional(body: FormData, key: string, value: string | number | null) {
  if (value !== null && value !== '') body.append(key, String(value))
}

function appendPartial(body: FormData, key: string, value: string | number | null | undefined) {
  if (value !== undefined) body.set(key, value === null ? 'null' : String(value))
}

export function serializeProductCreate(payload: ProductCreatePayload) {
  const numericValues = [
    payload.categoryId,
    payload.basePrice,
    payload.sortOrder,
    payload.discountPercentage,
    payload.isPersonalizable ? payload.personalizationMaxLength : null,
    payload.isPersonalizable ? payload.personalizationFee : null,
  ].filter((value): value is number => value !== null)
  if (numericValues.some((value) => !Number.isFinite(value))) {
    throw new Error('Product Create contains an invalid numeric value')
  }

  const body = new FormData()
  body.set('category_id', String(payload.categoryId))
  body.set('sku', payload.sku.trim())
  body.set('name[ar]', payload.name.ar.trim())
  appendOptional(body, 'name[en]', payload.name.en.trim())
  appendOptional(body, 'description[ar]', payload.description.ar.trim())
  appendOptional(body, 'description[en]', payload.description.en.trim())
  body.set('base_price', String(payload.basePrice))
  appendOptional(body, 'discount_percentage', payload.discountPercentage)
  appendOptional(body, 'discount_end_at', formatProductDateTime(payload.discountEndAt))
  body.set('is_personalizable', String(toApiBoolean(payload.isPersonalizable)))
  if (payload.isPersonalizable) {
    appendOptional(body, 'personalization_max_length', payload.personalizationMaxLength)
    appendOptional(body, 'personalization_fee', payload.personalizationFee)
  }
  body.set('hide_price_on_packaging', String(toApiBoolean(payload.hidePriceOnPackaging)))
  body.set('is_new_arrival', String(toApiBoolean(payload.isNewArrival)))
  body.set('is_active', String(toApiBoolean(payload.isActive)))
  body.set('sort_order', String(payload.sortOrder))
  payload.images.forEach((image) => body.append('images[]', image))
  return body
}

export function formatProductDateTime(value: string | null) {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return null
  const [date, time = ''] = trimmed.split('T')
  return `${date} ${time.length === 5 ? `${time}:00` : time}`
}

export function toProductDateTimeLocal(value: string | null) {
  if (!value) return ''
  const normalized = value.trim().replace(' ', 'T')
  return normalized.slice(0, 16)
}

function finiteNumber(value: number | string, field: string) {
  const normalized = typeof value === 'string' && value.trim() === '' ? Number.NaN : Number(value)
  if (!Number.isFinite(normalized)) throw new Error(`Product ${field} is unavailable`)
  return normalized
}

function nullableFiniteNumber(value: number | string | null, field: string) {
  return value === null ? null : finiteNumber(value, field)
}

function apiBoolean(value: boolean | 0 | 1 | '0' | '1', field: string) {
  if (value === true || value === 1 || value === '1') return true
  if (value === false || value === 0 || value === '0') return false
  throw new Error(`Product ${field} is unavailable`)
}

export function normalizeProductDetail(raw: RawProductDetail): ProductDetail {
  const description = Array.isArray(raw.description) || raw.description === null ? {} : raw.description
  return {
    id: finiteNumber(raw.id, 'id'),
    categoryId: raw.category_id === null ? null : finiteNumber(raw.category_id, 'category'),
    sku: raw.sku,
    name: { ar: raw.name.ar ?? '', en: raw.name.en ?? '' },
    description: { ar: description.ar ?? '', en: description.en ?? '' },
    slug: raw.slug,
    basePrice: finiteNumber(raw.base_price, 'base price'),
    discountPercentage: nullableFiniteNumber(raw.discount_percentage, 'discount percentage'),
    discountEndAt: raw.discount_end_at,
    isPersonalizable: apiBoolean(raw.is_personalizable, 'personalizable flag'),
    personalizationMaxLength: nullableFiniteNumber(raw.personalization_max_length, 'personalization max length'),
    personalizationFee: nullableFiniteNumber(raw.personalization_fee, 'personalization fee'),
    hidePriceOnPackaging: apiBoolean(raw.hide_price_on_packaging, 'packaging price flag'),
    isNewArrival: apiBoolean(raw.is_new_arrival, 'new arrival flag'),
    isActive: apiBoolean(raw.is_active, 'active flag'),
    sortOrder: finiteNumber(raw.sort_order, 'sort order'),
    simulatedViewersCount: finiteNumber(raw.simulated_viewers_count, 'simulated viewers count'),
    simulatedOrdersCount: finiteNumber(raw.simulated_orders_count, 'simulated orders count'),
    variants: raw.variants.map(normalizeProductVariant),
    images: raw.images.map((image) => ({ id: finiteNumber(image.id, 'image id'), url: image.url })),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function serializeProductUpdate(payload: ProductUpdatePayload) {
  const body = new FormData()
  appendPartial(body, 'category_id', payload.categoryId)
  appendPartial(body, 'sku', payload.sku?.trim())
  appendPartial(body, 'name[ar]', payload.name?.ar === null ? null : payload.name?.ar?.trim())
  appendPartial(body, 'name[en]', payload.name?.en === null ? null : payload.name?.en?.trim())
  appendPartial(body, 'description[ar]', payload.description?.ar === null ? null : payload.description?.ar?.trim())
  appendPartial(body, 'description[en]', payload.description?.en === null ? null : payload.description?.en?.trim())
  appendPartial(body, 'base_price', payload.basePrice)
  appendPartial(body, 'discount_percentage', payload.discountPercentage)
  appendPartial(
    body,
    'discount_end_at',
    payload.discountEndAt === undefined || payload.discountEndAt === null
      ? payload.discountEndAt
      : formatProductDateTime(payload.discountEndAt)
  )
  if (payload.isPersonalizable !== undefined)
    body.set('is_personalizable', String(toApiBoolean(payload.isPersonalizable)))
  appendPartial(body, 'personalization_max_length', payload.personalizationMaxLength)
  appendPartial(body, 'personalization_fee', payload.personalizationFee)
  if (payload.hidePriceOnPackaging !== undefined)
    body.set('hide_price_on_packaging', String(toApiBoolean(payload.hidePriceOnPackaging)))
  if (payload.isNewArrival !== undefined) body.set('is_new_arrival', String(toApiBoolean(payload.isNewArrival)))
  if (payload.isActive !== undefined) body.set('is_active', String(toApiBoolean(payload.isActive)))
  appendPartial(body, 'sort_order', payload.sortOrder)
  payload.images?.forEach((image) => body.append('images[]', image))
  return body
}

export function normalizeProductListItem(raw: RawProductListItem): ProductListItem {
  const basePrice = raw.base_price.trim() === '' ? Number.NaN : Number(raw.base_price)
  if (!Number.isFinite(basePrice)) throw new Error('Product base price is unavailable')

  let discountPercentage: number | null = null
  if (raw.discount_percentage !== null) {
    discountPercentage =
      typeof raw.discount_percentage === 'string' && raw.discount_percentage.trim() === ''
        ? Number.NaN
        : Number(raw.discount_percentage)

    if (!Number.isFinite(discountPercentage)) {
      throw new Error('Product discount percentage is unavailable')
    }
  }

  return {
    id: raw.id,
    categoryId: raw.category_id,
    sku: raw.sku,
    name: { ...raw.name },
    slug: raw.slug,
    basePrice,
    discountPercentage,
    discountEndAt: raw.discount_end_at,
    isPersonalizable: raw.is_personalizable,
    isNewArrival: raw.is_new_arrival,
    isActive: raw.is_active,
    sortOrder: raw.sort_order,
    simulatedViewersCount: raw.simulated_viewers_count,
    simulatedOrdersCount: raw.simulated_orders_count,
    variantCount: raw.variants.length,
    primaryImageUrl: raw.images[0] ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export const productsHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    return (
      await $http.get<ProductsIndexResponse>({
        url: '/dashboard/products',
        query: { page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
  },
  async create(body: FormData) {
    return (
      await $http.post<ProductCreateResponse>({
        url: '/dashboard/products',
        data: body,
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async show(id: number, signal?: AbortSignal) {
    return (
      await $http.get<RawProductDetailResponse>({
        url: `/dashboard/products/${id}`,
        signal,
        suppressErrorNotification: true,
      })
    ).data
  },
  async update(id: number, body: FormData) {
    return (
      await $http.put<RawProductDetailResponse>({
        url: `/dashboard/products/${id}`,
        data: body,
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
  async delete(id: number) {
    return (
      await $http.delete<ProductDeleteResponse>({
        url: `/dashboard/products/${id}`,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    ).data
  },
}

const transport = env.PRODUCTS_USE_MOCK ? productsMockTransport : productsHttpTransport

export const productsService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<ProductListItem>> {
    const response = await transport.list(page, signal)
    const items = response.data.map(normalizeProductListItem)

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
  async create(payload: ProductCreatePayload) {
    const response = await transport.create(serializeProductCreate(payload))
    return response.data
  },
  async show(id: number, signal?: AbortSignal) {
    return normalizeProductDetail((await transport.show(id, signal)).data)
  },
  async update(id: number, payload: ProductUpdatePayload) {
    return normalizeProductDetail((await transport.update(id, serializeProductUpdate(payload))).data)
  },
  delete: (id: number) => transport.delete(id),
}
