import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import { productMediaService } from '@/modules/products/api/product-media.service'
import { productVariantStocksService } from '@/modules/products/api/product-variant-stocks.service'
import { productVariantsService } from '@/modules/products/api/product-variants.service'
import { useCreateProductVariant } from '@/modules/products/hooks/useCreateProductVariant'
import { useDeleteProductVariant } from '@/modules/products/hooks/useDeleteProductVariant'
import { useDeleteProductVariantMedia } from '@/modules/products/hooks/useDeleteProductVariantMedia'
import { useDeleteProductVariantStock } from '@/modules/products/hooks/useDeleteProductVariantStock'
import { usePutProductVariantStock } from '@/modules/products/hooks/usePutProductVariantStock'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductVariant } from '@/modules/products/types/product-variant.types'
import type { ProductDetail } from '@/modules/products/types/product.types'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

const variant = (id: number): ProductVariant => ({
  id,
  sku: `VAR-${id}`,
  attributes: { color: id === 1 ? 'silver' : 'gold' },
  priceOverride: null,
  isActive: true,
  images: [
    { id: id * 10 + 1, url: `${id}-one.jpg` },
    { id: id * 10 + 2, url: `${id}-two.jpg` },
  ],
  warehouseStocks: [],
})

const product: ProductDetail = {
  id: 7,
  categoryId: 1,
  sku: 'PRODUCT',
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
  variants: [variant(1), variant(2)],
  images: [],
  createdAt: 'created',
  updatedAt: 'updated',
}

function setup(initialProduct = product) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  client.setQueryData(productsKeys.detail(7), initialProduct)
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, invalidate, wrapper }
}

describe('Product Variant mutation cache ownership', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('appends the authoritative created Variant and invalidates Product lists once', async () => {
    const created = variant(3)
    vi.spyOn(productVariantsService, 'create').mockResolvedValue(created)
    const { client, invalidate, wrapper } = setup()
    const { result } = renderHook(() => useCreateProductVariant(7), { wrapper })

    await act(() =>
      result.current.mutateAsync({
        sku: 'VAR-3',
        attributes: {},
        priceOverride: null,
        isActive: true,
        images: [],
      })
    )

    expect(client.getQueryData<ProductDetail>(productsKeys.detail(7))?.variants).toEqual([
      variant(1),
      variant(2),
      created,
    ])
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.lists() })
  })

  it('removes only the targeted Variant and invalidates Product lists once', async () => {
    vi.spyOn(productVariantsService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
    const { client, invalidate, wrapper } = setup()
    const { result } = renderHook(() => useDeleteProductVariant(7), { wrapper })

    await act(() => result.current.mutateAsync(1))

    expect(client.getQueryData<ProductDetail>(productsKeys.detail(7))?.variants).toEqual([variant(2)])
    expect(invalidate).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.lists() })
  })

  it('preserves all Variants when Delete fails', async () => {
    vi.spyOn(productVariantsService, 'delete').mockRejectedValue(new Error('unsafe'))
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useDeleteProductVariant(7), { wrapper })

    await expect(act(() => result.current.mutateAsync(1))).rejects.toThrow('unsafe')
    expect(client.getQueryData<ProductDetail>(productsKeys.detail(7))?.variants).toEqual(product.variants)
  })

  it('removes only targeted Variant media without invalidating Product lists', async () => {
    vi.spyOn(productMediaService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
    const { client, invalidate, wrapper } = setup()
    const { result } = renderHook(() => useDeleteProductVariantMedia(7), { wrapper })

    await act(() => result.current.mutateAsync({ variantId: 1, mediaId: 11 }))

    const cached = client.getQueryData<ProductDetail>(productsKeys.detail(7))
    expect(cached?.variants[0].images).toEqual([{ id: 12, url: '1-two.jpg' }])
    expect(cached?.variants[1]).toEqual(variant(2))
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('preserves targeted Variant media on failure', async () => {
    vi.spyOn(productMediaService, 'delete').mockRejectedValue(new Error('unsafe'))
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useDeleteProductVariantMedia(7), { wrapper })

    await expect(act(() => result.current.mutateAsync({ variantId: 1, mediaId: 11 }))).rejects.toThrow('unsafe')
    expect(client.getQueryData<ProductDetail>(productsKeys.detail(7))?.variants).toEqual(product.variants)
  })

  it('updates only an existing warehouse stock without invalidating Product lists', async () => {
    const initial = {
      ...product,
      variants: [
        { ...variant(1), warehouseStocks: [{ warehouseId: 4, quantity: 5 }] },
        { ...variant(2), warehouseStocks: [{ warehouseId: 6, quantity: 9 }] },
      ],
    }
    vi.spyOn(productVariantStocksService, 'put').mockResolvedValue({ warehouseId: 4, quantity: 0 })
    const { client, invalidate, wrapper } = setup(initial)
    const { result } = renderHook(() => usePutProductVariantStock(7), { wrapper })

    await act(() => result.current.mutateAsync({ variantId: 1, warehouseId: 4, quantity: 0 }))

    const cached = client.getQueryData<ProductDetail>(productsKeys.detail(7))
    expect(cached?.variants[0].warehouseStocks).toEqual([{ warehouseId: 4, quantity: 0 }])
    expect(cached?.variants[1]).toEqual(initial.variants[1])
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('appends a new warehouse stock without changing existing stocks or other Variants', async () => {
    const initial = {
      ...product,
      variants: [{ ...variant(1), warehouseStocks: [{ warehouseId: 4, quantity: 5 }] }, variant(2)],
    }
    vi.spyOn(productVariantStocksService, 'put').mockResolvedValue({ warehouseId: 8, quantity: 3 })
    const { client, invalidate, wrapper } = setup(initial)
    const { result } = renderHook(() => usePutProductVariantStock(7), { wrapper })

    await act(() => result.current.mutateAsync({ variantId: 1, warehouseId: 8, quantity: 3 }))

    const cached = client.getQueryData<ProductDetail>(productsKeys.detail(7))
    expect(cached?.variants[0].warehouseStocks).toEqual([
      { warehouseId: 4, quantity: 5 },
      { warehouseId: 8, quantity: 3 },
    ])
    expect(cached?.variants[1]).toEqual(initial.variants[1])
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('removes only the targeted warehouse stock without invalidating Product lists', async () => {
    const initial = {
      ...product,
      variants: [
        {
          ...variant(1),
          warehouseStocks: [
            { warehouseId: 4, quantity: 5 },
            { warehouseId: 8, quantity: 3 },
          ],
        },
        { ...variant(2), warehouseStocks: [{ warehouseId: 6, quantity: 9 }] },
      ],
    }
    vi.spyOn(productVariantStocksService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
    const { client, invalidate, wrapper } = setup(initial)
    const { result } = renderHook(() => useDeleteProductVariantStock(7), { wrapper })

    await act(() => result.current.mutateAsync({ variantId: 1, warehouseId: 4 }))

    const cached = client.getQueryData<ProductDetail>(productsKeys.detail(7))
    expect(cached?.variants[0].warehouseStocks).toEqual([{ warehouseId: 8, quantity: 3 }])
    expect(cached?.variants[1]).toEqual(initial.variants[1])
    expect(invalidate).not.toHaveBeenCalled()
  })
})
