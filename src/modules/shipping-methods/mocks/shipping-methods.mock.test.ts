import { beforeEach, describe, expect, it } from 'vitest'

import { resetShippingMethodsMock, shippingMethodsMockTransport } from './shipping-methods.mock'

describe('shippingMethodsMockTransport', () => {
  beforeEach(resetShippingMethodsMock)

  it('returns API-shaped paginated data and string prices', async () => {
    const response = await shippingMethodsMockTransport.list(1)
    expect(response.meta).toEqual({ current_page: 1, last_page: 1, per_page: 15, total: 3 })
    expect(typeof response.data[0].price).toBe('string')
  })

  it('creates, partially updates, and deletes without hidden behavior', async () => {
    const create = new FormData()
    create.set('code', 'same-day')
    create.set('name[ar]', 'نفس اليوم')
    create.set('name[en]', 'Same Day')
    create.set('eta_label[ar]', 'اليوم')
    create.set('eta_label[en]', 'Today')
    create.set('is_pickup', '0')
    create.set('price', '30.5')
    create.set('sort_order', '-1')
    create.set('is_active', '1')
    const created = await shippingMethodsMockTransport.create(create)
    expect(created.data).toMatchObject({ code: 'same-day', price: '30.5', sort_order: -1 })

    const update = new FormData()
    update.set('name[en]', 'Same Day Updated')
    const updated = await shippingMethodsMockTransport.update(created.data.id, update)
    expect(updated.data.name.en).toBe('Same Day Updated')
    expect(updated.data.name.ar).toBe('نفس اليوم')
    expect(updated.data.price).toBe('30.5')

    await shippingMethodsMockTransport.delete(created.data.id)
    const index = await shippingMethodsMockTransport.list(1)
    expect(index.meta.total).toBe(3)
    expect(index.data.some((method) => method.id === created.data.id)).toBe(false)
  })
})
