import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ post: vi.fn(), delete: vi.fn() }))
vi.mock('@/config/env', () => ({ default: { PRODUCTS_USE_MOCK: false } }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  normalizeProductVariant,
  productVariantsHttpTransport,
  serializeProductVariantCreate,
} from '@/modules/products/api/product-variants.service'
import type { RawProductVariant } from '@/modules/products/types/product-variant.types'

const rawVariant = (overrides: Partial<RawProductVariant> = {}): RawProductVariant => ({
  id: '12',
  sku: 'VAR-12',
  attributes: { color: 'silver' },
  price_override: '25.50',
  is_active: '1',
  images: [{ id: '91', url: 'variant.jpg' }],
  warehouse_stocks: [],
  ...overrides,
})

describe('Product Variant service', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['flat', { color: 'silver' }],
    ['null', null],
    ['empty object', {}],
    ['array', ['silver', 2]],
    ['nested', { dimensions: { width: 2 }, tags: ['new'] }],
    ['numeric and boolean', { rank: 2, featured: true }],
  ])('preserves %s JSON attributes while normalizing the Variant boundary', (_label, attributes) => {
    expect(normalizeProductVariant(rawVariant({ attributes }))).toMatchObject({
      id: 12,
      attributes,
      priceOverride: 25.5,
      isActive: true,
      images: [{ id: 91, url: 'variant.jpg' }],
    })
  })

  it('preserves null price override and normalizes false boolean forms', () => {
    expect(normalizeProductVariant(rawVariant({ price_override: null, is_active: 0 }))).toMatchObject({
      priceOverride: null,
      isActive: false,
    })
  })

  it('normalizes populated warehouse stocks with defensive numeric conversion', () => {
    expect(
      normalizeProductVariant(rawVariant({ warehouse_stocks: [{ warehouse_id: '4', quantity: '0' }] })).warehouseStocks
    ).toEqual([{ warehouseId: 4, quantity: 0 }])
  })

  it.each([
    { id: 'invalid' },
    { price_override: 'invalid' },
    { images: [{ id: 'invalid', url: 'image' }] },
    { warehouse_stocks: [{ warehouse_id: 4, quantity: 'invalid' }] },
  ])('fails safely for malformed numeric Variant fields', (override) => {
    expect(() => normalizeProductVariant(rawVariant(override))).toThrow(/Product Variant/)
  })

  it('serializes the confirmed flat Create multipart contract', () => {
    const first = new File(['one'], 'one.png', { type: 'image/png' })
    const second = new File(['two'], 'two.jpg', { type: 'image/jpeg' })
    const body = serializeProductVariantCreate({
      sku: ' VAR-1 ',
      attributes: { color: 'silver', size: 'large' },
      priceOverride: 30,
      isActive: false,
      images: [first, second],
    })

    expect([...body.entries()]).toEqual([
      ['sku', 'VAR-1'],
      ['attributes[color]', 'silver'],
      ['attributes[size]', 'large'],
      ['price_override', '30'],
      ['is_active', '0'],
      ['images[]', first],
      ['images[]', second],
    ])
    expect(body.has('warehouse_stocks')).toBe(false)
  })

  it('omits a null price override and serializes active as 1', () => {
    const body = serializeProductVariantCreate({
      sku: 'VAR-2',
      attributes: {},
      priceOverride: null,
      isActive: true,
      images: [],
    })
    expect([...body.entries()]).toEqual([
      ['sku', 'VAR-2'],
      ['is_active', '1'],
    ])
    expect(body.has('price_override')).toBe(false)
  })

  it('uses the exact Create endpoint with multipart FormData', async () => {
    httpMocks.post.mockResolvedValueOnce({ data: { success: true, message: 'created', data: rawVariant() } })
    const body = new FormData()
    await productVariantsHttpTransport.createVariant(7, body)
    expect(httpMocks.post).toHaveBeenCalledWith({
      url: '/dashboard/products/7/variants',
      data: body,
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })

  it('uses the exact Delete endpoint without a body', async () => {
    httpMocks.delete.mockResolvedValueOnce({ data: { success: true, message: 'deleted' } })
    await productVariantsHttpTransport.deleteVariant(7, 12)
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/products/7/variants/12',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
