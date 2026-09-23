import { beforeEach, describe, expect, it } from 'vitest'

import { productMediaService } from '@/modules/products/api/product-media.service'
import { productsMockTransport, resetProductsMock, seedProductsMock } from '@/modules/products/mocks/products.mock'
import type { RawProductListItem } from '@/modules/products/types/product.types'

const product: RawProductListItem = {
  id: 2,
  category_id: 1,
  sku: 'RFL-2',
  name: { ar: 'منتج', en: 'Product' },
  slug: 'product-2',
  base_price: '10.00',
  discount_percentage: null,
  discount_end_at: null,
  is_personalizable: false,
  is_new_arrival: false,
  is_active: true,
  sort_order: 2,
  simulated_viewers_count: 0,
  simulated_orders_count: 0,
  variants: [],
  images: ['one.jpg', 'two.jpg'],
  created_at: '2026-09-20T10:00:00+00:00',
  updated_at: '2026-09-20T10:00:00+00:00',
}

describe('productMediaService mock transport', () => {
  beforeEach(() => {
    resetProductsMock()
    seedProductsMock([product])
  })

  it('keeps mock Product Show state consistent after deleting media', async () => {
    await productMediaService.delete(201)

    const detail = await productsMockTransport.show(2)
    expect(detail.data.images).toEqual([{ id: 202, url: 'two.jpg' }])
  })
})
