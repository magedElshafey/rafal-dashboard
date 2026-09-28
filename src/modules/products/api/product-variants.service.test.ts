import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  normalizeProductVariant,
  productVariantsHttpTransport,
  productVariantsService,
  serializeProductVariantCreate,
  serializeProductVariantUpdate,
} from './product-variants.service'
import type { RawProductVariant } from '../types/product-variant.types'

const rawVariant = (overrides: Partial<RawProductVariant> = {}): RawProductVariant => ({
  id: '12',
  sku: 'VAR-12',
  attributes: { color: 'gold' },
  price_override: '25.50',
  is_active: '1',
  is_default: 1,
  images: [{ id: '91', url: 'variant.jpg' }],
  warehouse_stocks: [{ id: '7', warehouse_id: '4', quantity: '0' }],
  ...overrides,
})

describe('Product Variant service', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['flat', { color: 'gold' }],
    ['null', null],
    ['array', ['gold', 2]],
    ['nested', { dimensions: { width: 2 }, tags: ['new'] }],
  ])('preserves %s legacy JSON attributes safely', (_label, attributes) => {
    expect(normalizeProductVariant(rawVariant({ attributes }))).toMatchObject({
      id: 12,
      attributes,
      priceOverride: 25.5,
      isActive: true,
      isDefault: true,
      warehouseStocks: [{ id: 7, warehouseId: 4, quantity: 0 }],
    })
  })

  it('creates JSON when no images exist and never includes Stock', () => {
    expect(
      serializeProductVariantCreate({
        sku: ' VAR ',
        attributes: { color: 'gold' },
        priceOverride: null,
        isActive: true,
        images: [],
      })
    ).toEqual({ sku: 'VAR', attributes: { color: 'gold' }, is_active: 1 })
  })

  it('creates multipart only when new images exist', () => {
    const image = new File(['image'], 'variant.png', { type: 'image/png' })
    const body = serializeProductVariantCreate({
      sku: 'VAR',
      attributes: { size: 'l' },
      priceOverride: 30,
      isActive: false,
      images: [image],
    })
    expect(body).toBeInstanceOf(FormData)
    expect([...(body as FormData).entries()]).toEqual([
      ['sku', 'VAR'],
      ['attributes[size]', 'l'],
      ['price_override', '30'],
      ['is_active', '0'],
      ['images[]', image],
    ])
  })

  it('serializes partial Update, explicit price clear, and attribute MERGE keys as JSON', () => {
    expect(serializeProductVariantUpdate({ priceOverride: null, attributes: { color: 'silver' } })).toEqual({
      price_override: null,
      attributes: { color: 'silver' },
    })
  })

  it('sends textual null and repeated new files in multipart Update without remote images', () => {
    const first = new File(['first'], 'first.png', { type: 'image/png' })
    const second = new File(['second'], 'second.jpg', { type: 'image/jpeg' })
    const body = serializeProductVariantUpdate({ priceOverride: null, images: [first, second] })
    expect(body).toBeInstanceOf(FormData)
    expect([...(body as FormData).entries()]).toEqual([
      ['price_override', 'null'],
      ['images[]', first],
      ['images[]', second],
    ])
    expect([...(body as FormData).values()]).not.toContain('https://example.test/existing.jpg')
  })

  it('PUTs the exact partial Update endpoint and normalizes its response', async () => {
    httpMocks.put.mockResolvedValue({ data: { success: true, message: 'updated', data: rawVariant() } })
    await expect(productVariantsService.update(7, 12, { sku: ' NEXT ' })).resolves.toMatchObject({ id: 12 })
    expect(httpMocks.put).toHaveBeenCalledWith({
      url: '/dashboard/products/7/variants/12',
      data: { sku: 'NEXT' },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })

  it('uses the exact Create and Delete endpoints', async () => {
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'created', data: rawVariant() } })
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
    await productVariantsHttpTransport.createVariant(7, { sku: 'VAR' })
    await productVariantsHttpTransport.deleteVariant(7, 12)
    expect(httpMocks.post).toHaveBeenCalledWith({
      url: '/dashboard/products/7/variants',
      data: { sku: 'VAR' },
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/products/7/variants/12',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
