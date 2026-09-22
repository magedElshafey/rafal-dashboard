import env from '@/config/env'
import { productsMockTransport } from '@/modules/products/mocks/products.mock'
import type {
  ProductCreatePayload,
  ProductCreateResponse,
  ProductListItem,
  ProductsIndexResponse,
  RawProductListItem,
} from '@/modules/products/types/product.types'
import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import { $http } from '@/utils/http'

function appendOptional(body: FormData, key: string, value: string | number | null) {
  if (value !== null && value !== '') body.append(key, String(value))
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
}
