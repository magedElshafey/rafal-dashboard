import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  normalizeDashboardProductVariant,
  normalizeVariantAttributes,
  productVariantsHttpTransport,
  productVariantsService,
  serializeProductVariantCreate,
  serializeProductVariantUpdate,
} from './product-variants.service'
import type { RawDashboardProductVariant } from '../types/product-variant.types'

const rawVariant = (overrides: Partial<RawDashboardProductVariant> = {}): RawDashboardProductVariant => ({
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
    ['one arbitrary key', { any_thing_else: 'Test value' }],
    ['multiple arbitrary keys', { stone_type: 'diamond', chain_length: '45cm' }],
    ['default null', null],
    ['empty object', {}],
    ['legacy empty array', []],
  ])('normalizes %s attributes safely', (_label, attributes) => {
    expect(normalizeDashboardProductVariant(rawVariant({ attributes }))).toMatchObject({
      id: 12,
      attributes: attributes === null || Array.isArray(attributes) ? {} : attributes,
      priceOverride: 25.5,
      isActive: true,
      isDefault: true,
      warehouseStocks: [{ id: 7, warehouseId: 4, quantity: 0 }],
    })
  })

  it.each([
    ['absent', undefined, false],
    ['nullable', null, false],
    ['true', true, true],
    ['false', false, false],
  ] as const)('normalizes %s backend-owned is_default deliberately', (_label, isDefault, expected) => {
    expect(normalizeDashboardProductVariant(rawVariant({ is_default: isDefault })).isDefault).toBe(expected)
  })

  it.each([['gold'], { nested: { value: 1 } }, { count: 2 }])(
    'rejects malformed attribute data without weakening the dynamic map contract',
    (attributes) => {
      expect(() => normalizeDashboardProductVariant(rawVariant({ attributes }))).toThrow(
        'Product Variant attributes are unavailable'
      )
    }
  )

  it('preserves the observed flat attributes including an existing Unicode key', () => {
    const unicodeKey = 'تيست_تيست_تيست'
    const attributes = {
      size: '16',
      color: '#1D5259',
      any_thing: 'فسيبسي',
      [unicodeKey]: '11117',
    }

    const normalized = normalizeVariantAttributes(attributes)

    expect(normalized).toEqual(attributes)
    expect(normalized[unicodeKey]).toBe('11117')
  })

  it.each(['__proto__', 'prototype', 'constructor'])(
    'rejects the dangerous backend attribute key %s without constructing an unsafe map',
    (key) => {
      const attributes = JSON.parse(`{"${key}":"unsafe"}`) as unknown

      expect(() => normalizeVariantAttributes(attributes)).toThrow('Product Variant attributes are unavailable')
      expect(Object.prototype).not.toHaveProperty('unsafe')
    }
  )

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

  it('serializes partial Update, explicit price clear, and replace-all attributes as JSON', () => {
    expect(serializeProductVariantUpdate({ priceOverride: null, attributes: { color: 'silver' } })).toEqual({
      price_override: null,
      attributes: { color: 'silver' },
    })
    expect(serializeProductVariantUpdate({ attributes: {} })).toEqual({ attributes: {} })
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

  it('resolves the confirmed HTTP 201 Create envelope with an arbitrary attribute key', async () => {
    httpMocks.post.mockResolvedValue({
      status: 201,
      data: {
        success: true,
        message: 'Variant created successfully',
        data: {
          id: 16,
          sku: 'NCK-SLV-002-SILVER',
          attributes: { any_thing_else: 'Test value' },
          price_override: null,
          is_active: true,
          images: [],
          warehouse_stocks: [],
        },
      },
    })

    await expect(
      productVariantsService.create(7, {
        sku: 'NCK-SLV-002-SILVER',
        attributes: { any_thing_else: 'Test value' },
        priceOverride: null,
        isActive: true,
        images: [],
      })
    ).resolves.toMatchObject({
      id: 16,
      attributes: { any_thing_else: 'Test value' },
    })
    expect(httpMocks.post).toHaveBeenCalledTimes(1)
  })

  it('resolves the exact HTTP 201 Create response with nullable backend-owned is_default', async () => {
    httpMocks.post.mockResolvedValue({
      status: 201,
      data: {
        success: true,
        message: 'Variant created successfully',
        data: {
          id: 58,
          sku: 'TST-RING-001-SILVER-163231',
          attributes: { color: '#741616' },
          price_override: null,
          is_active: true,
          is_default: null,
          images: [],
          warehouse_stocks: [],
        },
      },
    })

    await expect(
      productVariantsService.create(34, {
        sku: 'TST-RING-001-SILVER-163231',
        attributes: { color: '#741616' },
        priceOverride: null,
        isActive: true,
        images: [],
      })
    ).resolves.toEqual({
      id: 58,
      sku: 'TST-RING-001-SILVER-163231',
      attributes: { color: '#741616' },
      priceOverride: null,
      isActive: true,
      isDefault: false,
      images: [],
      warehouseStocks: [],
    })
  })
})
