import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { productsService } from '@/modules/products/api/products.service'
import { resetProductsMock, seedProductsMock } from '@/modules/products/mocks/products.mock'
import type { RawProductListItem } from '@/modules/products/types/product.types'

import ProductsPage from './ProductsPage'

const rawProduct = (id: number, overrides: Partial<RawProductListItem> = {}): RawProductListItem => ({
  id,
  category_id: 4,
  sku: `RFL-${id}`,
  name: { ar: `منتج ${id}`, en: `Product ${id}` },
  slug: `product-${id}`,
  base_price: `${id}.50`,
  discount_percentage: null,
  discount_end_at: null,
  is_personalizable: false,
  is_new_arrival: false,
  is_active: true,
  sort_order: id,
  simulated_viewers_count: 10,
  simulated_orders_count: 2,
  variants: [],
  images: [],
  created_at: '2026-09-20T10:00:00+00:00',
  updated_at: '2026-09-20T10:00:00+00:00',
  ...overrides,
})

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductsPage />
    </QueryClientProvider>
  )
}

describe('ProductsPage', () => {
  beforeEach(async () => {
    resetProductsMock()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders the complete localized Index in desktop and mobile representations', async () => {
    seedProductsMock([
      rawProduct(1, {
        sku: 'RFL-DISCOUNTED',
        name: { ar: 'منتج مخفض', en: 'Discounted Product' },
        base_price: '250.50',
        discount_percentage: '15',
        is_new_arrival: true,
        variants: [{}, {}],
        images: ['https://example.test/product.jpg'],
        sort_order: 7,
      }),
      rawProduct(2, {
        sku: 'RFL-FALLBACK',
        name: { ar: 'اسم عربي بديل', en: '' },
        is_active: false,
        images: [],
      }),
    ])

    renderPage()

    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"].size-14').length).toBeGreaterThan(0)
    expect(await screen.findAllByText('Discounted Product')).toHaveLength(2)
    expect(screen.getAllByText('اسم عربي بديل')).toHaveLength(2)
    expect(screen.getAllByText('RFL-DISCOUNTED')).toHaveLength(2)
    expect(screen.getAllByText('RFL-DISCOUNTED').every((node) => node.getAttribute('dir') === 'ltr')).toBe(true)
    expect(screen.getAllByText('250.5')).toHaveLength(2)
    expect(screen.getAllByText('15%')).toHaveLength(2)
    expect(screen.getAllByText('2 variants')).toHaveLength(2)
    expect(
      screen.getAllByText('New Arrival').filter((node) => node.getAttribute('data-slot') === 'badge')
    ).toHaveLength(2)
    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(screen.getAllByText('Inactive')).toHaveLength(2)
    expect(screen.getAllByText('7')).toHaveLength(2)
    expect(document.querySelector('[data-slot="responsive-data-desktop"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="responsive-data-mobile-cards"]')).toBeInTheDocument()

    const loadedImage = screen.getAllByRole('img', { name: 'Image of Discounted Product' })[0]
    fireEvent.error(loadedImage)
    expect(screen.getAllByRole('img', { name: 'No product image' }).length).toBeGreaterThanOrEqual(3)
    expect(screen.getAllByRole('img', { name: 'No product image' })[0]).toHaveClass('bg-muted', 'text-muted-foreground')

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/filter/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /create|edit|delete/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /create|edit|delete/i })).not.toBeInTheDocument()
  })

  it('shows a safe initial error and retries into the empty state', async () => {
    seedProductsMock([])
    const originalList = productsService.list
    vi.spyOn(productsService, 'list')
      .mockRejectedValueOnce(new Error('unsafe backend stack detail'))
      .mockImplementation(originalList)
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe backend stack detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No products yet')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /create product/i })).not.toBeInTheDocument()
  })

  it('renders the localized empty state in Arabic', async () => {
    await i18n.changeLanguage('ar')
    seedProductsMock([])

    renderPage()

    expect(await screen.findByText('لا توجد منتجات بعد')).toBeInTheDocument()
    expect(screen.getByText('ستظهر المنتجات هنا بعد إنشائها.')).toBeInTheDocument()
  })

  it('keeps loaded products visible when a later page fails and retries that page', async () => {
    seedProductsMock(Array.from({ length: 16 }, (_, index) => rawProduct(index + 1)))
    const originalList = productsService.list
    const list = vi
      .spyOn(productsService, 'list')
      .mockImplementationOnce(originalList)
      .mockRejectedValueOnce(new Error('unsafe second-page detail'))
      .mockImplementation(originalList)
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findAllByText('Product 1')).toHaveLength(2)
    expect(await screen.findByTestId('query-state-refetch-error')).toBeInTheDocument()
    expect(screen.getAllByText('Product 1')).toHaveLength(2)
    expect(screen.queryByText('unsafe second-page detail')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findAllByText('Product 16')).toHaveLength(2)
    await waitFor(() => expect(list).toHaveBeenCalledTimes(3))
    expect(list.mock.calls.map(([page]) => page)).toEqual([1, 2, 2])
  })
})
