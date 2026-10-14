import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosHeaders } from 'axios'
import { inventoryService, parseInventoryResponse } from '@/modules/inventory/api/inventory.service'
import { $http } from '@/utils/http'
import { rawResponse, rawStock } from './inventory.fixtures'

vi.mock('@/utils/http', () => ({ $http: { get: vi.fn() } }))

function reply(data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config: { headers: new AxiosHeaders() } }
}

describe('warehouse stock contract', () => {
  beforeEach(() => vi.resetAllMocks())

  it('preserves stock, product, variant, and warehouse identity without merging balances', () => {
    const parsed = parseInventoryResponse(rawResponse([rawStock(), rawStock(173, 8), rawStock(174, 6, 46)]))
    expect(parsed.items.map((stock) => [stock.id, stock.product.id, stock.variant.id, stock.warehouse.id])).toEqual([
      [172, 22, 45, 6],
      [173, 22, 45, 8],
      [174, 22, 46, 6],
    ])
    expect(parsed.items[0].variant.attributes).toEqual({ length: '50ml', lenth: 'exact', Size: 'M', size: 'm' })
    expect(parsed.items[0].product.name).toEqual({ ar: 'عطر مسك أبيض', en: 'White Musk Perfume' })
    expect(parsed.meta.low_stock_threshold).toBe(5)
    expect(parsed.items[0]).not.toHaveProperty('reserved')
    expect(parsed.items[0]).not.toHaveProperty('counted')
  })

  it.each([null, [], {}])('normalizes empty attributes %j using the existing variant contract', (attributes) => {
    const stock = rawStock()
    const parsed = parseInventoryResponse(rawResponse([{ ...stock, variant: { ...stock.variant, attributes } }]))
    expect(parsed.items[0].variant.attributes).toEqual({})
  })

  it('uses backend status and threshold without deriving either from quantity', () => {
    const parsed = parseInventoryResponse({
      ...rawResponse([{ ...rawStock(), quantity: 88, stock_status: 'low_stock' }]),
      meta: { ...rawResponse().meta, low_stock_threshold: 0 },
    })
    expect(parsed.items[0].stockStatus).toBe('low_stock')
    expect(parsed.meta.low_stock_threshold).toBe(0)
  })

  it.each([
    { ...rawStock(), id: 0 },
    { ...rawStock(), quantity: '88' },
    { ...rawStock(), variant: { ...rawStock().variant, attributes: ['not empty'] } },
    { ...rawStock(), variant: { ...rawStock().variant, attributes: { nested: { size: 'M' } } } },
    { ...rawStock(), updated_at: 'invalid' },
  ])('rejects malformed data instead of displaying invented quantities', (stock) => {
    expect(() => parseInventoryResponse(rawResponse([stock]))).toThrow()
  })

  it('rejects repeated stock IDs and unsuccessful envelopes', () => {
    expect(() => parseInventoryResponse(rawResponse([rawStock(), rawStock()]))).toThrow()
    expect(() => parseInventoryResponse({ ...rawResponse(), success: false })).toThrow()
  })

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, -Infinity, null, '88'])(
    'rejects invalid stock quantity %s without rounding or coercing',
    (quantity) => {
      expect(() => parseInventoryResponse(rawResponse([{ ...rawStock(), quantity }]))).toThrow()
    }
  )

  it.each([0, 1, Number.MAX_SAFE_INTEGER])('preserves valid stock quantity %s exactly', (quantity) => {
    expect(parseInventoryResponse(rawResponse([{ ...rawStock(), quantity }])).items[0].quantity).toBe(quantity)
  })

  it.each([0, 0.00001, 5])('preserves numeric threshold %s independently of stock quantities', (threshold) => {
    const response = rawResponse()
    expect(
      parseInventoryResponse({ ...response, meta: { ...response.meta, low_stock_threshold: threshold } }).meta
        .low_stock_threshold
    ).toBe(threshold)
  })

  it.each([NaN, Infinity, -Infinity, null, '5'])('rejects invalid threshold %s', (threshold) => {
    const response = rawResponse()
    expect(() =>
      parseInventoryResponse({ ...response, meta: { ...response.meta, low_stock_threshold: threshold } })
    ).toThrow()
  })

  it.each([1, 2])('serializes only confirmed warehouse/page %s parameters and forwards cancellation', async (page) => {
    vi.mocked($http.get).mockResolvedValue(reply(rawResponse([rawStock()], page, 9)))
    const controller = new AbortController()
    const response = await inventoryService.list(6, page, controller.signal)
    expect($http.get).toHaveBeenCalledExactlyOnceWith({
      url: '/dashboard/warehouse-stocks',
      query: { warehouse_id: 6, page },
      signal: controller.signal,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    expect(response.meta).toMatchObject({ current_page: page, last_page: 9, total: 30 })
  })

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, undefined, null, '6'])(
    'rejects invalid warehouse/page %s before transport',
    async (value) => {
      await expect(inventoryService.list(value as number, 1)).rejects.toThrow()
      await expect(inventoryService.list(6, value as number)).rejects.toThrow()
      expect($http.get).not.toHaveBeenCalled()
    }
  )

  it('rejects mixed warehouse scope without silently filtering records', async () => {
    vi.mocked($http.get).mockResolvedValue(reply(rawResponse([rawStock(), rawStock(173, 8)])))
    await expect(inventoryService.list(6, 1)).rejects.toThrow('Inventory warehouse scope mismatch')
  })

  it('rejects a different in-range response page and permits metadata for out-of-range correction', async () => {
    vi.mocked($http.get).mockResolvedValue(reply(rawResponse([rawStock()], 1, 2)))
    await expect(inventoryService.list(6, 2)).rejects.toThrow('Inventory page mismatch')
    vi.mocked($http.get).mockResolvedValue(reply(rawResponse([], 9, 2)))
    expect((await inventoryService.list(6, 9)).meta.last_page).toBe(2)
  })
})
