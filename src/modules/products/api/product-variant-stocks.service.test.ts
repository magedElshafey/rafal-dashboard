import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ put: vi.fn(), delete: vi.fn() }))
vi.mock('@/config/env', () => ({ default: { PRODUCTS_USE_MOCK: false } }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import {
  productVariantStocksHttpTransport,
  productVariantStocksService,
  serializeVariantWarehouseStock,
} from '@/modules/products/api/product-variant-stocks.service'

describe('Product Variant stock service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('serializes quantity and preserves valid zero', () => {
    expect([...serializeVariantWarehouseStock(8).entries()]).toEqual([['quantity', '8']])
    expect([...serializeVariantWarehouseStock(0).entries()]).toEqual([['quantity', '0']])
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid quantity %s', (quantity) => {
    expect(() => serializeVariantWarehouseStock(quantity)).toThrow('quantity is invalid')
  })

  it('uses the exact PUT endpoint with quantity-only multipart and normalizes numeric strings', async () => {
    httpMocks.put.mockResolvedValueOnce({
      data: { success: true, message: 'saved', data: { warehouse_id: '4', quantity: '0' } },
    })

    await expect(productVariantStocksService.put(7, 12, 4, 0)).resolves.toEqual({ warehouseId: 4, quantity: 0 })

    const request = httpMocks.put.mock.calls[0][0]
    expect(request).toMatchObject({
      url: '/dashboard/products/7/variants/12/stocks/4',
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect([...request.data.entries()]).toEqual([['quantity', '0']])
  })

  it('uses the exact DELETE endpoint without a body', async () => {
    httpMocks.delete.mockResolvedValueOnce({ data: { success: true, message: 'deleted' } })
    await productVariantStocksHttpTransport.deleteStock(7, 12, 4)
    expect(httpMocks.delete).toHaveBeenCalledWith({
      url: '/dashboard/products/7/variants/12/stocks/4',
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
  })

  it.each([
    { warehouse_id: 'invalid', quantity: 1 },
    { warehouse_id: 4, quantity: 'invalid' },
    { warehouse_id: 4, quantity: -1 },
    { warehouse_id: 4, quantity: 1.5 },
  ])('fails safely for malformed authoritative stock %#', async (data) => {
    httpMocks.put.mockResolvedValueOnce({ data: { success: true, message: 'saved', data } })
    await expect(productVariantStocksService.put(7, 12, 4, 1)).rejects.toThrow('Product Variant')
  })
})
