import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  productsHttpTransport,
  productsService,
  serializeProductCreate,
  serializeProductUpdate,
} from './products.service'
import type { ProductCreatePayload, RawProductDetail, RawProductListItem } from '../types/product.types'
import { emptyProductsFilters } from '../utils/product-filters'

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
  variants: [],
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

const realDashboardProductShow: RawProductDetail = {
  id: 26,
  category_id: 5,
  sku: 'RAF-dcb-308633',
  name: { ar: 'منتج', en: 'product without variant' },
  description: {
    ar: '<p>product without variant</p>',
    en: '<p>product without variant</p>',
  },
  slug: 'mntg',
  base_price: '149.00',
  base_price_incl_vat: '186.25',
  discount_percentage: null,
  discount_end_at: null,
  is_personalizable: false,
  personalization_max_length: null,
  personalization_fee: null,
  personalization_languages: ['ar', 'en'],
  hide_price_on_packaging: true,
  is_new_arrival: true,
  is_active: true,
  sort_order: 2,
  simulated_viewers_count: 2880,
  simulated_orders_count: 71091,
  category: { id: 5, name: { ar: 'هدايا', en: 'Gifts' }, slug: 'gifts' },
  variants: [
    {
      id: 39,
      sku: 'RAF-dcb-308633',
      attributes: null,
      price_override: null,
      is_active: true,
      is_default: true,
      images: [],
      warehouse_stocks: [
        { id: 153, warehouse_id: 1, quantity: 3 },
        { id: 154, warehouse_id: 2, quantity: 4 },
        { id: 155, warehouse_id: 3, quantity: 4 },
        { id: 156, warehouse_id: 4, quantity: 4 },
        { id: 158, warehouse_id: 5, quantity: 4 },
        { id: 157, warehouse_id: 6, quantity: 5 },
        { id: 159, warehouse_id: 7, quantity: 6 },
      ],
    },
  ],
  images: [{ id: 42, url: 'https://api.rafal.shop/storage/42/TST-RING-001-main-01.png' }],
  created_at: '2026-10-03T17:39:48+00:00',
  updated_at: '2026-10-03T17:39:48+00:00',
}

describe('products service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requests the exact supported filters and page while forwarding AbortSignal', async () => {
    const controller = new AbortController()
    mockIndex(rawProduct())
    const filters = {
      ...emptyProductsFilters,
      isPersonalizable: false,
      isNewArrival: true,
      hasDiscount: false,
      priceMin: 0,
      priceMax: 100,
      createdFrom: '2026-10-01',
      createdTo: '2026-10-09',
      sortBy: 'base_price' as const,
      sortDir: 'desc' as const,
    }

    await productsHttpTransport.list(filters, 3, controller.signal)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/products',
      query: {
        is_personalizable: 0,
        is_new_arrival: 1,
        has_discount: 0,
        price_min: 0,
        price_max: 100,
        created_from: '2026-10-01',
        created_to: '2026-10-09',
        sort_by: 'base_price',
        sort_dir: 'desc',
        page: 3,
      },
      signal: controller.signal,
      suppressErrorNotification: true,
    })
  })

  it('normalizes Index values and pagination without inventing detail data', async () => {
    const product = rawProduct({
      base_price: '50.00',
      discount_percentage: '12.5',
      images: [
        { id: 42, url: 'url-a' },
        { id: '43', url: 'url-b' },
      ],
      variants: [{ opaque: true }, { another: 'record' }],
    })
    mockIndex(product)

    const result = await productsService.list(emptyProductsFilters, 2)

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
      images: [
        { id: 42, url: 'url-a' },
        { id: 43, url: 'url-b' },
      ],
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

    const result = await productsService.list(emptyProductsFilters, 1)

    expect(result.items[0]).toMatchObject({
      basePrice: 50,
      discountPercentage: null,
      images: [],
      variantCount: 0,
    })
  })

  it('normalizes legacy string-only Index media only at the Index boundary', async () => {
    mockIndex(rawProduct({ images: ['https://example.com/legacy.jpg'] }))

    await expect(productsService.list(emptyProductsFilters, 1)).resolves.toMatchObject({
      items: [{ images: [{ id: -1, url: 'https://example.com/legacy.jpg' }] }],
    })
  })

  it.each(['', 'not-a-price', 'Infinity'])(
    'rejects invalid base_price %s without fabricating zero',
    async (base_price) => {
      mockIndex(rawProduct({ base_price }))

      await expect(productsService.list(emptyProductsFilters, 1)).rejects.toThrow('Product base price is unavailable')
    }
  )

  it.each(['', 'not-a-discount'])('rejects an invalid numeric discount %s', async (discount_percentage) => {
    mockIndex(rawProduct({ discount_percentage }))

    await expect(productsService.list(emptyProductsFilters, 1)).rejects.toThrow(
      'Product discount percentage is unavailable'
    )
  })

  it('POSTs the exact multipart Product Create contract with trimmed values and repeated images', async () => {
    const firstImage = new File(['first'], 'first.png', { type: 'image/png' })
    const secondImage = new File(['second'], 'second.jpg', { type: 'image/jpeg' })
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'created', data: { id: 81 } } })

    await expect(
      productsService.create(
        createPayload({
          images: [firstImage, secondImage],
          variants: [
            {
              sku: ' VAR-1 ',
              attributes: { color: '#C8102E', size: 'L' },
              priceOverride: 45,
              isActive: true,
              stocks: [{ warehouseId: 3, quantity: 0 }],
            },
          ],
        })
      )
    ).resolves.toEqual({ id: 81 })

    expect(httpMocks.post).toHaveBeenCalledTimes(1)
    const request = httpMocks.post.mock.calls[0][0]
    expect(request).toMatchObject({
      url: '/dashboard/products',
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect([...(request.data as FormData).entries()]).toEqual([
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
      ['variants[0][sku]', 'VAR-1'],
      ['variants[0][attributes][color]', '#C8102E'],
      ['variants[0][attributes][size]', 'L'],
      ['variants[0][price_override]', '45'],
      ['variants[0][is_active]', '1'],
      ['variants[0][stocks][0][warehouse_id]', '3'],
      ['variants[0][stocks][0][quantity]', '0'],
    ])
    expect((request.data as FormData).has('slug')).toBe(false)
    expect((request.data as FormData).has('variants')).toBe(false)
    expect((request.data as FormData).has('stocks')).toBe(false)
    expect((request.data as FormData).has('simulated_viewers_count')).toBe(false)
    expect((request.data as FormData).has('simulated_orders_count')).toBe(false)
  })

  it('requires Product media before serializing aggregate Create', () => {
    expect(() => serializeProductCreate(createPayload({ images: [] }))).toThrow(
      'Product Create requires at least one image'
    )
  })

  it('omits nullable Create fields and disabled personalization values', () => {
    const image = new File(['image'], 'product.png', { type: 'image/png' })
    const body = serializeProductCreate(
      createPayload({
        name: { ar: 'منتج', en: '   ' },
        description: { ar: '', en: ' ' },
        discountPercentage: null,
        discountEndAt: null,
        isPersonalizable: false,
        personalizationMaxLength: 20,
        personalizationFee: 5,
        images: [image],
      })
    )

    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).has('name[en]')).toBe(false)
    expect((body as FormData).has('description[ar]')).toBe(false)
    expect((body as FormData).has('discount_percentage')).toBe(false)
    expect((body as FormData).has('personalization_max_length')).toBe(false)
    expect((body as FormData).has('personalization_fee')).toBe(false)
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
          base_price_incl_vat: '57.79',
          personalization_fee: '3.5',
          personalization_languages: ['ar', 'en'],
          category: { id: '4', name: { ar: 'فئة', en: 'Category' }, slug: 'read-only-category' },
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
      basePriceInclVat: 57.79,
      personalizationFee: 3.5,
      personalizationLanguages: ['ar', 'en'],
      category: { id: 4, name: { ar: 'فئة', en: 'Category' }, slug: 'read-only-category' },
      description: { ar: '<p><strong>فضة</strong></p>', en: '<ul><li>Silver</li></ul>' },
      images: [{ id: 12, url: 'https://example.com/product.jpg' }],
    })
  })

  it('normalizes the real Dashboard Product Show response containing a default Variant', async () => {
    httpMocks.get.mockResolvedValueOnce({
      data: { success: true, message: 'Product retrieved successfully', data: realDashboardProductShow },
    })

    const result = await productsService.show(26)

    expect(result).toMatchObject({
      id: 26,
      images: [{ id: 42, url: 'https://api.rafal.shop/storage/42/TST-RING-001-main-01.png' }],
      variants: [
        {
          id: 39,
          attributes: {},
          priceOverride: null,
          isActive: true,
          isDefault: true,
          warehouseStocks: [
            { id: 153, warehouseId: 1, quantity: 3 },
            { id: 154, warehouseId: 2, quantity: 4 },
            { id: 155, warehouseId: 3, quantity: 4 },
            { id: 156, warehouseId: 4, quantity: 4 },
            { id: 158, warehouseId: 5, quantity: 4 },
            { id: 157, warehouseId: 6, quantity: 5 },
            { id: 159, warehouseId: 7, quantity: 6 },
          ],
        },
      ],
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
    expect([...(body as FormData).entries()]).toEqual([
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
    expect((body as FormData).has('slug')).toBe(false)
    expect((body as FormData).has('sku')).toBe(false)
  })

  it('uses JSON null clears and keeps localized fields granular when no media is added', () => {
    const body = serializeProductUpdate({
      name: { en: null },
      description: { en: null },
      discountEndAt: null,
      personalizationMaxLength: null,
      personalizationFee: null,
    })
    expect(body).toEqual({
      name: { en: null },
      description: { en: null },
      discount_end_at: null,
      personalization_max_length: null,
      personalization_fee: null,
    })
  })

  it('PUTs partial JSON without Product children and normalizes the complete authoritative response', async () => {
    httpMocks.put.mockResolvedValueOnce({
      data: { success: true, message: 'updated', data: rawDetail({ sku: 'UPDATED' }) },
    })
    await expect(productsService.update(9, { sku: ' UPDATED ' })).resolves.toMatchObject({ id: 1, sku: 'UPDATED' })
    expect(httpMocks.put).toHaveBeenCalledWith({
      url: '/dashboard/products/9',
      data: { sku: 'UPDATED' },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect(httpMocks.put.mock.calls[0][0].data).not.toHaveProperty('variants')
    expect(httpMocks.put.mock.calls[0][0].data).not.toHaveProperty('warehouse_stocks')
    expect(httpMocks.put.mock.calls[0][0].data).not.toHaveProperty('slug')
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
