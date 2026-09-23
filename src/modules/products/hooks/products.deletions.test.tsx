import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { productMediaService } from '@/modules/products/api/product-media.service'
import { productsService } from '@/modules/products/api/products.service'
import { useDeleteProduct } from '@/modules/products/hooks/useDeleteProduct'
import { useDeleteProductMedia } from '@/modules/products/hooks/useDeleteProductMedia'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

const product: ProductDetail = {
  id: 7,
  categoryId: 1,
  sku: 'SKU',
  name: { ar: 'منتج', en: 'Product' },
  description: { ar: '', en: '' },
  slug: 'product',
  basePrice: 10,
  discountPercentage: null,
  discountEndAt: null,
  isPersonalizable: false,
  personalizationMaxLength: null,
  personalizationFee: null,
  hidePriceOnPackaging: false,
  isNewArrival: false,
  isActive: true,
  sortOrder: 0,
  simulatedViewersCount: 0,
  simulatedOrdersCount: 0,
  variants: [],
  images: [
    { id: 11, url: 'one' },
    { id: 12, url: 'two' },
  ],
  createdAt: 'created',
  updatedAt: 'updated',
}

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, invalidate, wrapper }
}

describe('Product deletion cache ownership', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
  })

  it('removes the deleted Product detail and invalidates only Product lists', async () => {
    vi.spyOn(productsService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
    const { client, invalidate, wrapper } = setup()
    client.setQueryData(productsKeys.detail(7), product)
    const { result } = renderHook(useDeleteProduct, { wrapper })

    await act(() => result.current.mutateAsync(7))

    expect(client.getQueryData(productsKeys.detail(7))).toBeUndefined()
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.lists() })
  })

  it('removes only the confirmed media ID from detail and invalidates Product lists', async () => {
    const remove = vi.spyOn(productMediaService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
    const { client, invalidate, wrapper } = setup()
    client.setQueryData(productsKeys.detail(7), product)
    const { result } = renderHook(() => useDeleteProductMedia(7), { wrapper })

    await act(() => result.current.mutateAsync(11))

    expect(remove).toHaveBeenCalledWith(11)
    expect(client.getQueryData<ProductDetail>(productsKeys.detail(7))?.images).toEqual([{ id: 12, url: 'two' }])
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.lists() })
  })
})
