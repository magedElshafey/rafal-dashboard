import { normalizeDashboardProductVariant } from '@/modules/products/api/product-variants.service'
import type {
  ProductCreatePayload,
  ProductCreateResponse,
  ProductDetail,
  ProductDeleteResponse,
  ProductListItem,
  ProductsFilters,
  ProductUpdatePayload,
  ProductsIndexResponse,
  RawProductDetail,
  RawProductDetailResponse,
  RawProductListItem,
} from '@/modules/products/types/product.types'
import { serializeProductsFilters } from '@/modules/products/utils/product-filters'
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
    payload.maxCartItemQuantity,
    payload.sortOrder,
    payload.discountPercentage,
    payload.isPersonalizable ? payload.personalizationMaxLength : null,
    payload.isPersonalizable ? payload.personalizationFee : null,
  ].filter((value): value is number => value !== null)
  if (numericValues.some((value) => !Number.isFinite(value))) {
    throw new Error('Product Create contains an invalid numeric value')
  }
  if (payload.images.length === 0) throw new Error('Product Create requires at least one image')

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
  body.set('max_cart_item_quantity', String(payload.maxCartItemQuantity))
  body.set('is_new_arrival', String(toApiBoolean(payload.isNewArrival)))
  body.set('is_active', String(toApiBoolean(payload.isActive)))
  body.set('sort_order', String(payload.sortOrder))
  payload.images.forEach((image) => body.append('images[]', image))
  payload.variants.forEach((variant, variantIndex) => {
    const prefix = `variants[${variantIndex}]`
    body.set(`${prefix}[sku]`, variant.sku.trim())
    Object.entries(variant.attributes).forEach(([key, value]) => {
      body.set(`${prefix}[attributes][${key}]`, value)
    })
    appendOptional(body, `${prefix}[price_override]`, variant.priceOverride)
    body.set(`${prefix}[is_active]`, String(toApiBoolean(variant.isActive)))
    variant.stocks.forEach((stock, stockIndex) => {
      const stockPrefix = `${prefix}[stocks][${stockIndex}]`
      body.set(`${stockPrefix}[warehouse_id]`, String(stock.warehouseId))
      body.set(`${stockPrefix}[quantity]`, String(stock.quantity))
    })
  })
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

function normalizeProductMedia(image: { id: number | string; url: string }) {
  if (typeof image.url !== 'string' || image.url.trim() === '') throw new Error('Product image is unavailable')
  return { id: finiteNumber(image.id, 'image id'), url: image.url }
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
    basePriceInclVat:
      raw.base_price_incl_vat === undefined ? null : finiteNumber(raw.base_price_incl_vat, 'base price including VAT'),
    discountPercentage: nullableFiniteNumber(raw.discount_percentage, 'discount percentage'),
    discountEndAt: raw.discount_end_at,
    isPersonalizable: apiBoolean(raw.is_personalizable, 'personalizable flag'),
    personalizationMaxLength: nullableFiniteNumber(raw.personalization_max_length, 'personalization max length'),
    personalizationFee: nullableFiniteNumber(raw.personalization_fee, 'personalization fee'),
    personalizationLanguages: raw.personalization_languages ?? null,
    maxCartItemQuantity: finiteNumber(raw.max_cart_item_quantity, 'maximum cart item quantity'),
    isNewArrival: apiBoolean(raw.is_new_arrival, 'new arrival flag'),
    isActive: apiBoolean(raw.is_active, 'active flag'),
    sortOrder: finiteNumber(raw.sort_order, 'sort order'),
    simulatedViewersCount: finiteNumber(raw.simulated_viewers_count, 'simulated viewers count'),
    simulatedOrdersCount: finiteNumber(raw.simulated_orders_count, 'simulated orders count'),
    category: raw.category
      ? {
          id: finiteNumber(raw.category.id, 'category id'),
          name: { ...raw.category.name },
          ...(raw.category.slug ? { slug: raw.category.slug } : {}),
        }
      : null,
    variants: raw.variants.map(normalizeDashboardProductVariant),
    images: raw.images.map(normalizeProductMedia),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function serializeProductUpdate(payload: ProductUpdatePayload) {
  const json = {
    ...(payload.categoryId !== undefined ? { category_id: payload.categoryId } : {}),
    ...(payload.sku !== undefined ? { sku: payload.sku.trim() } : {}),
    ...(payload.name !== undefined
      ? {
          name: {
            ...(payload.name.ar !== undefined ? { ar: payload.name.ar === null ? null : payload.name.ar.trim() } : {}),
            ...(payload.name.en !== undefined ? { en: payload.name.en === null ? null : payload.name.en.trim() } : {}),
          },
        }
      : {}),
    ...(payload.description !== undefined
      ? {
          description: {
            ...(payload.description.ar !== undefined
              ? { ar: payload.description.ar === null ? null : payload.description.ar.trim() }
              : {}),
            ...(payload.description.en !== undefined
              ? { en: payload.description.en === null ? null : payload.description.en.trim() }
              : {}),
          },
        }
      : {}),
    ...(payload.basePrice !== undefined ? { base_price: payload.basePrice } : {}),
    ...(payload.discountPercentage !== undefined ? { discount_percentage: payload.discountPercentage } : {}),
    ...(payload.discountEndAt !== undefined
      ? { discount_end_at: payload.discountEndAt === null ? null : formatProductDateTime(payload.discountEndAt) }
      : {}),
    ...(payload.isPersonalizable !== undefined ? { is_personalizable: toApiBoolean(payload.isPersonalizable) } : {}),
    ...(payload.personalizationMaxLength !== undefined
      ? { personalization_max_length: payload.personalizationMaxLength }
      : {}),
    ...(payload.personalizationFee !== undefined ? { personalization_fee: payload.personalizationFee } : {}),
    ...(payload.maxCartItemQuantity !== undefined ? { max_cart_item_quantity: payload.maxCartItemQuantity } : {}),
    ...(payload.isNewArrival !== undefined ? { is_new_arrival: toApiBoolean(payload.isNewArrival) } : {}),
    ...(payload.isActive !== undefined ? { is_active: toApiBoolean(payload.isActive) } : {}),
    ...(payload.sortOrder !== undefined ? { sort_order: payload.sortOrder } : {}),
  }
  if (!payload.images?.length) return json

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
  appendPartial(body, 'max_cart_item_quantity', payload.maxCartItemQuantity)
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

  const images = raw.images.map((image, index) =>
    typeof image === 'string' ? { id: -(index + 1), url: image } : normalizeProductMedia(image)
  )

  return {
    id: finiteNumber(raw.id, 'id'),
    categoryId: raw.category_id === null ? null : finiteNumber(raw.category_id, 'category'),
    sku: raw.sku,
    name: { ...raw.name },
    slug: raw.slug,
    basePrice,
    discountPercentage,
    discountEndAt: raw.discount_end_at,
    isPersonalizable: apiBoolean(raw.is_personalizable, 'personalizable flag'),
    isNewArrival: apiBoolean(raw.is_new_arrival, 'new arrival flag'),
    isActive: apiBoolean(raw.is_active, 'active flag'),
    sortOrder: finiteNumber(raw.sort_order, 'sort order'),
    simulatedViewersCount: finiteNumber(raw.simulated_viewers_count, 'simulated viewers count'),
    simulatedOrdersCount: finiteNumber(raw.simulated_orders_count, 'simulated orders count'),
    variantCount: raw.variants.length,
    images,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export const productsHttpTransport = {
  async list(filters: ProductsFilters, page: number, signal?: AbortSignal) {
    return (
      await $http.get<ProductsIndexResponse>({
        url: '/dashboard/products',
        query: { ...serializeProductsFilters(filters), page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
  },
  async create(body: FormData | Record<string, unknown>) {
    const isFormData = body instanceof FormData
    return (
      await $http.post<ProductCreateResponse>({
        url: '/dashboard/products',
        data: body,
        ...(isFormData ? { isFormData: true } : {}),
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
  async update(id: number, body: FormData | Record<string, unknown>) {
    const isFormData = body instanceof FormData
    return (
      await $http.put<RawProductDetailResponse>({
        url: `/dashboard/products/${id}`,
        data: body,
        ...(isFormData ? { isFormData: true } : {}),
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

export const productsService = {
  async list(filters: ProductsFilters, page: number, signal?: AbortSignal): Promise<PaginatedData<ProductListItem>> {
    const response = await productsHttpTransport.list(filters, page, signal)
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
    const response = await productsHttpTransport.create(serializeProductCreate(payload))
    return response.data
  },
  async show(id: number, signal?: AbortSignal) {
    return normalizeProductDetail((await productsHttpTransport.show(id, signal)).data)
  },
  async update(id: number, payload: ProductUpdatePayload) {
    return normalizeProductDetail((await productsHttpTransport.update(id, serializeProductUpdate(payload))).data)
  },
  delete: (id: number) => productsHttpTransport.delete(id),
}
