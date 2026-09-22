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

  it('consumes Create FormData and persists a backend-shaped Product into Index', async () => {
    seedProductsMock([])
    const body = new FormData()
    body.set('category_id', '7')
    body.set('sku', 'RFL-MOCK-1')
    body.set('name[ar]', 'منتج تجريبي')
    body.set('name[en]', 'Mock Product')
    body.set('base_price', '99.50')
    body.set('discount_percentage', '12')
    body.set('is_personalizable', '0')
    body.set('hide_price_on_packaging', '1')
    body.set('is_new_arrival', '1')
    body.set('is_active', '1')
    body.set('sort_order', '-3')
    body.append('images[]', new File(['image'], 'product.png', { type: 'image/png' }))

    const created = await productsMockTransport.create(body)
    const index = await productsMockTransport.list(1)

    expect(created).toMatchObject({ success: true, message: 'Product created successfully', data: { id: 1 } })
    expect(index.meta.total).toBe(1)
    expect(index.data[0]).toMatchObject({
      id: 1,
      category_id: 7,
      sku: 'RFL-MOCK-1',
      name: { ar: 'منتج تجريبي', en: 'Mock Product' },
      slug: 'rfl-mock-1',
      base_price: '99.50',
      discount_percentage: '12',
      is_personalizable: false,
      is_new_arrival: true,
      is_active: true,
      sort_order: -3,
      simulated_viewers_count: 0,
      simulated_orders_count: 0,
      variants: [],
      images: ['mock://products/1/images/1'],
    })
    expect(typeof index.data[0].base_price).toBe('string')
  })
})
