import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/config/env', () => ({ default: { PRODUCTS_USE_MOCK: false } }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { productsHttpTransport, productsService } from './products.service'
import type { RawProductListItem } from '../types/product.types'

const rawProduct = (overrides: Partial<RawProductListItem> = {}): RawProductListItem => ({
  id: 1,
  category_id: 4,
  sku: 'RFL-001',
  name: { ar: 'منتج', en: 'Product' },
  slug: 'product',
  base_price: '50.00',
  discount_percentage: null,
  discount_end_at: null,
  is_personalizable: false,
  is_new_arrival: true,
  is_active: true,
  sort_order: 2,
  simulated_viewers_count: 10,
  simulated_orders_count: 3,
  variants: [],
  images: [],
  created_at: '2026-09-20T10:00:00+00:00',
  updated_at: '2026-09-20T11:00:00+00:00',
  ...overrides,
})

function mockIndex(product: RawProductListItem, meta = { current_page: 2, last_page: 4, per_page: 15, total: 52 }) {
  httpMocks.get.mockResolvedValue({
    data: { success: true, message: 'ok', data: [product], meta },
  })
}

describe('products service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requests only the exact page query and forwards AbortSignal', async () => {
    const controller = new AbortController()
    mockIndex(rawProduct())

    await productsHttpTransport.list(3, controller.signal)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/products',
      query: { page: 3 },
      signal: controller.signal,
      suppressErrorNotification: true,
    })
  })

  it('normalizes Index values and pagination without inventing detail data', async () => {
    const product = rawProduct({
      base_price: '50.00',
      discount_percentage: '12.5',
      images: ['url-a', 'url-b'],
      variants: [{ opaque: true }, { another: 'record' }],
    })
    mockIndex(product)

    const result = await productsService.list(2)

    expect(result.items[0]).toEqual({
      id: 1,
      categoryId: 4,
      sku: 'RFL-001',
      name: product.name,
      slug: 'product',
      basePrice: 50,
      discountPercentage: 12.5,
      discountEndAt: null,
      isPersonalizable: false,
      isNewArrival: true,
      isActive: true,
      sortOrder: 2,
      simulatedViewersCount: 10,
      simulatedOrdersCount: 3,
      variantCount: 2,
      primaryImageUrl: 'url-a',
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    })
    expect(result.paginate).toMatchObject({
      current_page: 2,
      total_pages: 4,
      per_page: 15,
      total: 52,
      count: 1,
      next_page_url: '3',
      prev_page_url: '1',
    })
  })

  it('preserves null discounts, empty images, and zero variants', async () => {
    mockIndex(rawProduct({ discount_percentage: null, images: [], variants: [] }))

    const result = await productsService.list(1)

    expect(result.items[0]).toMatchObject({
      basePrice: 50,
      discountPercentage: null,
      primaryImageUrl: null,
      variantCount: 0,
    })
  })

  it.each(['', 'not-a-price', 'Infinity'])(
    'rejects invalid base_price %s without fabricating zero',
    async (base_price) => {
      mockIndex(rawProduct({ base_price }))

      await expect(productsService.list(1)).rejects.toThrow('Product base price is unavailable')
    }
  )

  it.each(['', 'not-a-discount'])('rejects an invalid numeric discount %s', async (discount_percentage) => {
    mockIndex(rawProduct({ discount_percentage }))

    await expect(productsService.list(1)).rejects.toThrow('Product discount percentage is unavailable')
  })
})
