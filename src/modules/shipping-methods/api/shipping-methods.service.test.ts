import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))

vi.mock('@/config/env', () => ({ default: { SHIPPING_METHODS_USE_MOCK: false } }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  serializeShippingMethodCreate,
  serializeShippingMethodUpdate,
  shippingMethodsService,
} from './shipping-methods.service'

const rawMethod = {
  id: 1,
  code: 'standard',
  name: { ar: 'شحن عادي', en: 'Standard Shipping' },
  eta_label: { ar: '٣-٥ أيام عمل', en: '3-5 business days' },
  price: '25.00',
  is_pickup: false,
  is_active: true,
  sort_order: -1,
  created_at: '2026-09-20T19:55:22+00:00',
  updated_at: '2026-09-20T19:55:22+00:00',
}

describe('shippingMethodsService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalizes paginated API data into domain values', async () => {
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [rawMethod],
        meta: { current_page: 1, last_page: 2, per_page: 15, total: 16 },
      },
    })
    const result = await shippingMethodsService.list(1)
    expect(result.items[0]).toEqual({
      id: 1,
      code: 'standard',
      name: rawMethod.name,
      etaLabel: rawMethod.eta_label,
      price: 25,
      isPickup: false,
      isActive: true,
      sortOrder: -1,
      createdAt: rawMethod.created_at,
      updatedAt: rawMethod.updated_at,
    })
    expect(result.paginate).toMatchObject({ current_page: 1, total_pages: 2, per_page: 15, total: 16 })
  })

  it('serializes exact Create FormData keys with trimmed text and shared boolean values', () => {
    const body = serializeShippingMethodCreate({
      code: ' standard ',
      name: { ar: ' شحن عادي ', en: ' Standard Shipping ' },
      etaLabel: { ar: ' ٣-٥ أيام ', en: ' 3-5 days ' },
      price: 25.5,
      isPickup: false,
      isActive: true,
      sortOrder: 0,
    })
    expect([...body.entries()]).toEqual([
      ['code', 'standard'],
      ['name[ar]', 'شحن عادي'],
      ['name[en]', 'Standard Shipping'],
      ['eta_label[ar]', '٣-٥ أيام'],
      ['eta_label[en]', '3-5 days'],
      ['is_pickup', '0'],
      ['price', '25.5'],
      ['sort_order', '0'],
      ['is_active', '1'],
    ])
  })

  it.each([
    [{ code: ' next ' }, [['code', 'next']]],
    [{ nameAr: ' عربي ' }, [['name[ar]', 'عربي']]],
    [{ nameEn: ' English ' }, [['name[en]', 'English']]],
    [{ etaLabelAr: ' يومان ' }, [['eta_label[ar]', 'يومان']]],
    [{ etaLabelEn: ' 2 days ' }, [['eta_label[en]', '2 days']]],
    [{ price: 12.5 }, [['price', '12.5']]],
    [{ isActive: false }, [['is_active', '0']]],
    [{ sortOrder: -2 }, [['sort_order', '-2']]],
    [{ isPickup: false }, [['is_pickup', '0']]],
  ] as const)('serializes only the supplied partial field', (payload, expected) => {
    expect([...serializeShippingMethodUpdate(payload).entries()]).toEqual(expected)
  })

  it('serializes Pickup ON with exactly its required zero price', () => {
    expect([...serializeShippingMethodUpdate({ isPickup: true, price: 0 }).entries()]).toEqual([
      ['is_pickup', '1'],
      ['price', '0'],
    ])
    expect(() => serializeShippingMethodUpdate({ isPickup: true })).toThrow()
    expect(() =>
      serializeShippingMethodCreate({
        code: 'pickup',
        name: { ar: 'استلام', en: 'Pickup' },
        etaLabel: { ar: 'اليوم', en: 'Today' },
        price: 5,
        isPickup: true,
        isActive: true,
        sortOrder: null,
      })
    ).toThrow()
  })

  it('uses multipart for Create and partial Update, and sends no Delete body', async () => {
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'created', data: rawMethod } })
    httpMocks.put.mockResolvedValue({ data: { success: true, message: 'updated', data: rawMethod } })
    httpMocks.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } })
    await shippingMethodsService.create({
      code: 'standard',
      name: rawMethod.name,
      etaLabel: rawMethod.eta_label,
      price: 25,
      isPickup: false,
      isActive: true,
      sortOrder: 1,
    })
    await shippingMethodsService.update(1, { etaLabelEn: '4 days' })
    await shippingMethodsService.delete(1)
    expect(httpMocks.post.mock.calls[0][0]).toMatchObject({
      url: '/dashboard/shipping-methods',
      isFormData: true,
    })
    expect([...httpMocks.put.mock.calls[0][0].data.entries()]).toEqual([['eta_label[en]', '4 days']])
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/shipping-methods/1',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })
})
