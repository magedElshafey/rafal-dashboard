import { beforeEach, describe, expect, it } from 'vitest'

import type { RawProductListItem } from '@/modules/products/types/product.types'

import { productsMockTransport, resetProductsMock, seedProductsMock } from './products.mock'

const rawProduct = (id: number, overrides: Partial<RawProductListItem> = {}): RawProductListItem => ({
  id,
  category_id: 1,
  sku: `RFL-${id}`,
  name: { ar: `منتج ${id}`, en: `Product ${id}` },
  slug: `product-${id}`,
  base_price: `${id}.00`,
  discount_percentage: null,
  discount_end_at: null,
  is_personalizable: false,
  is_new_arrival: false,
  is_active: true,
  sort_order: id,
  simulated_viewers_count: 0,
  simulated_orders_count: 0,
  variants: [],
  images: [],
  created_at: '2026-09-20T10:00:00+00:00',
  updated_at: '2026-09-20T10:00:00+00:00',
  ...overrides,
})

describe('products mock transport', () => {
  beforeEach(resetProductsMock)

  it('returns an API-shaped page with backend-shaped values', async () => {
    const response = await productsMockTransport.list(1)

    expect(response).toMatchObject({
      success: true,
      message: 'Products retrieved successfully',
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 3 },
    })
    expect(typeof response.data[0].base_price).toBe('string')
    expect(response.data.some((product) => product.images.length === 0)).toBe(true)
    expect(response.data.some((product) => product.variants.length > 0)).toBe(true)
  })

  it('paginates a collection larger than 15 onto a second page', async () => {
    seedProductsMock(Array.from({ length: 16 }, (_, index) => rawProduct(index + 1)))

    const first = await productsMockTransport.list(1)
    const second = await productsMockTransport.list(2)

    expect(first.data).toHaveLength(15)
    expect(first.meta).toEqual({ current_page: 1, last_page: 2, per_page: 15, total: 16 })
    expect(second.data.map((product) => product.id)).toEqual([16])
  })

  it('supports an empty collection without changing the API shape', async () => {
    seedProductsMock([])

    const response = await productsMockTransport.list(1)

    expect(response.data).toEqual([])
    expect(response.meta).toEqual({ current_page: 1, last_page: 1, per_page: 15, total: 0 })
  })

  it('preserves opaque variants and empty images for service normalization', async () => {
    seedProductsMock([rawProduct(1, { variants: [{ color_id: 2 }, {}], images: [] })])

    const response = await productsMockTransport.list(1)

    expect(response.data[0]).toMatchObject({ variants: [{ color_id: 2 }, {}], images: [] })
  })

  it('honors an already-aborted request', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(productsMockTransport.list(1, controller.signal)).rejects.toBe(controller.signal.reason)
  })
})
