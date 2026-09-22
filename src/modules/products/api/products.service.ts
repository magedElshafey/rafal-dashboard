import env from '@/config/env'
import { productsMockTransport } from '@/modules/products/mocks/products.mock'
import type { ProductListItem, ProductsIndexResponse, RawProductListItem } from '@/modules/products/types/product.types'
import { $http } from '@/utils/http'

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
}
