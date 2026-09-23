import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/config/env', () => ({ default: { PRODUCTS_USE_MOCK: false } }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  productsHttpTransport,
  productsService,
  serializeProductCreate,
  serializeProductUpdate,
} from './products.service'
import type { ProductCreatePayload, RawProductDetail, RawProductListItem } from '../types/product.types'

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

const createPayload = (overrides: Partial<ProductCreatePayload> = {}): ProductCreatePayload => ({
  categoryId: 4,
  sku: ' RFL-CREATE-001 ',
  name: { ar: ' منتج جديد ', en: ' New Product ' },
  description: { ar: ' <p>وصف <strong>المنتج</strong></p> ', en: ' <ul><li>Description</li></ul> ' },
  basePrice: 50.25,
  discountPercentage: 10,
  discountEndAt: '2026-10-03T14:05',
  isPersonalizable: true,
  personalizationMaxLength: 20,
  personalizationFee: 5.5,
  hidePriceOnPackaging: true,
  isNewArrival: false,
  isActive: true,
  sortOrder: -2,
  images: [],
  ...overrides,
})

const rawDetail = (overrides: Partial<RawProductDetail> = {}): RawProductDetail => ({
  ...rawProduct(),
  description: [],
  personalization_max_length: null,
  personalization_fee: null,
  hide_price_on_packaging: false,
  variants: [],
  images: [{ id: 12, url: 'https://example.com/product.jpg' }],
  ...overrides,
})

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

  it('POSTs the exact multipart Product Create contract with trimmed values and repeated images', async () => {
    const firstImage = new File(['first'], 'first.png', { type: 'image/png' })
    const secondImage = new File(['second'], 'second.jpg', { type: 'image/jpeg' })
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'created', data: { id: 81 } } })

    await expect(productsService.create(createPayload({ images: [firstImage, secondImage] }))).resolves.toEqual({
      id: 81,
    })

    expect(httpMocks.post).toHaveBeenCalledTimes(1)
    const request = httpMocks.post.mock.calls[0][0]
    expect(request).toMatchObject({
      url: '/dashboard/products',
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect([...request.data.entries()]).toEqual([
      ['category_id', '4'],
      ['sku', 'RFL-CREATE-001'],
      ['name[ar]', 'منتج جديد'],
      ['name[en]', 'New Product'],
      ['description[ar]', '<p>وصف <strong>المنتج</strong></p>'],
      ['description[en]', '<ul><li>Description</li></ul>'],
      ['base_price', '50.25'],
      ['discount_percentage', '10'],
      ['discount_end_at', '2026-10-03 14:05:00'],
      ['is_personalizable', '1'],
      ['personalization_max_length', '20'],
      ['personalization_fee', '5.5'],
      ['hide_price_on_packaging', '1'],
      ['is_new_arrival', '0'],
      ['is_active', '1'],
      ['sort_order', '-2'],
      ['images[]', firstImage],
      ['images[]', secondImage],
    ])
    expect(request.data.has('slug')).toBe(false)
    expect(request.data.has('variants')).toBe(false)
    expect(request.data.has('stocks')).toBe(false)
    expect(request.data.has('simulated_viewers_count')).toBe(false)
    expect(request.data.has('simulated_orders_count')).toBe(false)
  })

  it('omits nullable Create fields and disabled personalization values', () => {
    const body = serializeProductCreate(
      createPayload({
        name: { ar: 'منتج', en: '   ' },
        description: { ar: '', en: ' ' },
        discountPercentage: null,
        discountEndAt: null,
        isPersonalizable: false,
        personalizationMaxLength: 20,
        personalizationFee: 5,
      })
    )

    expect([...body.keys()]).toEqual([
      'category_id',
      'sku',
      'name[ar]',
      'base_price',
      'is_personalizable',
      'hide_price_on_packaging',
      'is_new_arrival',
      'is_active',
      'sort_order',
    ])
  })

  it.each([{ basePrice: Number.NaN }, { discountPercentage: Number.POSITIVE_INFINITY }, { sortOrder: Number.NaN }])(
    'never serializes invalid numeric Create values',
    (override) => {
      expect(() => serializeProductCreate(createPayload(override))).toThrow(
        'Product Create contains an invalid numeric value'
      )
    }
  )

  it('GETs the exact Product Show endpoint and normalizes detail without losing HTML', async () => {
    const controller = new AbortController()
    httpMocks.get.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'ok',
        data: rawDetail({
          description: { ar: '<p><strong>فضة</strong></p>', en: '<ul><li>Silver</li></ul>' },
          base_price: '50.25',
          personalization_fee: '3.5',
        }),
      },
    })

    const product = await productsService.show(7, controller.signal)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/products/7',
      signal: controller.signal,
      suppressErrorNotification: true,
    })
    expect(product).toMatchObject({
      basePrice: 50.25,
      personalizationFee: 3.5,
      description: { ar: '<p><strong>فضة</strong></p>', en: '<ul><li>Silver</li></ul>' },
      images: [{ id: 12, url: 'https://example.com/product.jpg' }],
    })
  })

  it('normalizes [] descriptions to empty localized strings and rejects malformed numeric detail', async () => {
    httpMocks.get.mockResolvedValueOnce({ data: { success: true, message: 'ok', data: rawDetail() } })
    await expect(productsService.show(1)).resolves.toMatchObject({ description: { ar: '', en: '' } })
    httpMocks.get.mockResolvedValueOnce({
      data: { success: true, message: 'ok', data: rawDetail({ base_price: 'invalid' }) },
    })
    await expect(productsService.show(1)).rejects.toThrow('Product base price is unavailable')
  })

  it('serializes true partial Update clears, booleans, HTML, and repeated new images without slug', () => {
    const image = new File(['new'], 'new.png', { type: 'image/png' })
    const body = serializeProductUpdate({
      description: { en: '<p><strong>Hello</strong></p>', ar: null },
      discountPercentage: null,
      discountEndAt: '2026-10-03T14:05',
      isPersonalizable: false,
      personalizationMaxLength: null,
      personalizationFee: null,
      isActive: true,
      images: [image],
    })
    expect([...body.entries()]).toEqual([
      ['description[ar]', 'null'],
      ['description[en]', '<p><strong>Hello</strong></p>'],
      ['discount_percentage', 'null'],
      ['discount_end_at', '2026-10-03 14:05:00'],
      ['is_personalizable', '0'],
      ['personalization_max_length', 'null'],
      ['personalization_fee', 'null'],
      ['is_active', '1'],
      ['images[]', image],
    ])
    expect(body.has('slug')).toBe(false)
    expect(body.has('sku')).toBe(false)
  })

  it('serializes every nullable clear as textual null while keeping localized fields granular', () => {
    const body = serializeProductUpdate({
      name: { en: null },
      description: { en: null },
      discountEndAt: null,
      personalizationMaxLength: null,
      personalizationFee: null,
    })
    expect([...body.entries()]).toEqual([
      ['name[en]', 'null'],
      ['description[en]', 'null'],
      ['discount_end_at', 'null'],
      ['personalization_max_length', 'null'],
      ['personalization_fee', 'null'],
    ])
    expect(body.has('name[ar]')).toBe(false)
    expect(body.has('description[ar]')).toBe(false)
  })

  it('PUTs multipart and normalizes the complete authoritative response', async () => {
    httpMocks.put.mockResolvedValueOnce({
      data: { success: true, message: 'updated', data: rawDetail({ sku: 'UPDATED' }) },
    })
    await expect(productsService.update(9, { sku: ' UPDATED ' })).resolves.toMatchObject({ id: 1, sku: 'UPDATED' })
    expect(httpMocks.put).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/dashboard/products/9',
        isFormData: true,
        suppressSuccessNotification: true,
        suppressErrorNotification: true,
      })
    )
    expect([...httpMocks.put.mock.calls[0][0].data.entries()]).toEqual([['sku', 'UPDATED']])
    expect(httpMocks.put.mock.calls[0][0].data.has('variants')).toBe(false)
    expect(httpMocks.put.mock.calls[0][0].data.has('warehouse_stocks')).toBe(false)
  })

  it('DELETEs the exact Product endpoint without a request body', async () => {
    httpMocks.delete.mockResolvedValueOnce({ data: { success: true, message: 'deleted' } })

    await expect(productsService.delete(19)).resolves.toEqual({ success: true, message: 'deleted' })

    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/products/19',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
