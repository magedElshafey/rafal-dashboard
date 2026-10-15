import { describe, expect, it, vi } from 'vitest'
import { ordersService } from '../api/orders.service'
import { emptyOrdersFilters } from '../utils/order-filters'
import { rawOrderListItemSchema, rawOrderDetailSchema } from '../schemas/order.schema'
import fixture from './orders-index-runtime.fixture.json'
import detail from './order-detail.fixture.json'

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))

describe('Orders Index nullable email contract', () => {
  it('preserves blank names, null emails and decimal totals from the supplied response', async () => {
    http.get.mockResolvedValue({ data: fixture })
    const result = await ordersService.list(emptyOrdersFilters)
    expect(result.items.map((item) => item.customer)).toEqual(fixture.data.map((item) => item.customer))
    expect(result.items.map((item) => item.total)).toEqual(['404.80', '138017.25'])
    expect(http.get).toHaveBeenCalledTimes(1)
  })

  it('still rejects missing or malformed email and retains the Details contract', () => {
    for (const email of [undefined, 123, {}, []]) {
      expect(
        rawOrderListItemSchema.safeParse({ ...fixture.data[0], customer: { ...fixture.data[0].customer, email } })
          .success
      ).toBe(false)
    }
    expect(
      rawOrderDetailSchema.safeParse({ ...detail.data, customer: { ...detail.data.customer, email: null } }).success
    ).toBe(false)
  })
})
