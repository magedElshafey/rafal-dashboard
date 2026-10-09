import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { normalizeProductListItem, productsService } from '@/modules/products/api/products.service'
import type { ProductListItem, ProductsFilters, RawProductListItem } from '@/modules/products/types/product.types'

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

let productItems: ProductListItem[] = []

function seedProducts(items: RawProductListItem[]) {
  productItems = items.map(normalizeProductListItem)
}

async function listFixture(_filters: ProductsFilters, page: number) {
  const perPage = 15
  const pageItems = productItems.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.max(1, Math.ceil(productItems.length / perPage))
  return {
    items: pageItems,
    paginate: {
      current_page: page,
      total_pages: totalPages,
      per_page: perPage,
      total: productItems.length,
      count: pageItems.length,
      next_page_url: page < totalPages ? String(page + 1) : null,
      prev_page_url: page > 1 ? String(page - 1) : null,
    },
    extra: null,
  }
}

function installServiceFixtures() {
  vi.spyOn(productsService, 'list').mockImplementation(listFixture)
  vi.spyOn(productsService, 'delete').mockImplementation(async (id) => {
    productItems = productItems.filter((product) => product.id !== id)
    return { success: true, message: 'deleted' }
  })
}

function renderPage(initialEntry = '/dashboard/products') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/dashboard/products" element={<ProductsPage />} />
          <Route path="/dashboard/products/new" element={<p>Product Create destination</p>} />
          <Route path="/dashboard/products/:id/edit" element={<p>Product Edit destination</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('ProductsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    seedProducts([])
    installServiceFixtures()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders the complete localized Index in desktop and mobile representations', async () => {
    seedProducts([
      rawProduct(1, {
        sku: 'RFL-DISCOUNTED',
        name: { ar: 'منتج مخفض', en: 'Discounted Product' },
        base_price: '250.50',
        discount_percentage: '15',
        is_new_arrival: true,
        variants: [{}, {}],
        images: [{ id: 42, url: 'https://example.test/product.jpg' }],
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
    expect(loadedImage).toHaveAttribute('src', 'https://example.test/product.jpg')
    expect(loadedImage).not.toHaveAttribute('src', '[object Object]')
    fireEvent.error(loadedImage)
    expect(screen.getAllByRole('img', { name: 'No product image' }).length).toBeGreaterThanOrEqual(3)
    expect(screen.getAllByRole('img', { name: 'No product image' })[0]).toHaveClass('bg-muted', 'text-muted-foreground')

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Product' })).toHaveAttribute('href', '/dashboard/products/new')
    expect(screen.getAllByRole('button', { name: 'Actions for Discounted Product' })).toHaveLength(2)
  })

  it('shows a safe initial error and retries into the empty state', async () => {
    seedProducts([])
    const originalList = listFixture
    vi.spyOn(productsService, 'list')
      .mockRejectedValueOnce(new Error('unsafe backend stack detail'))
      .mockImplementation(originalList)
    const user = userEvent.setup()

    renderPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe backend stack detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No products yet')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Create Product' })).toHaveLength(2)
  })

  it('renders the localized empty state in Arabic', async () => {
    await i18n.changeLanguage('ar')
    seedProducts([])

    renderPage()

    expect(await screen.findByText('لا توجد منتجات بعد')).toBeInTheDocument()
    expect(screen.getByText('ستظهر المنتجات هنا بعد إنشائها.')).toBeInTheDocument()
  })

  it('keeps loaded products visible when a later page fails and retries that page', async () => {
    seedProducts(Array.from({ length: 16 }, (_, index) => rawProduct(index + 1)))
    const originalList = listFixture
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
    expect(list.mock.calls.map(([, page]) => page)).toEqual([1, 2, 2])
    expect(list.mock.calls.map(([filters]) => filters)).toEqual([
      expect.objectContaining({ priceMin: null }),
      expect.objectContaining({ priceMin: null }),
      expect.objectContaining({ priceMin: null }),
    ])
  })

  it('restarts pagination on Apply, retains filters on next pages, and resets through the shared wrapper', async () => {
    seedProducts(Array.from({ length: 16 }, (_, index) => rawProduct(index + 1)))
    const list = vi.spyOn(productsService, 'list').mockImplementation(listFixture)
    const user = userEvent.setup()

    renderPage('/dashboard/products?page=4&price_min=10&is_personalizable=0')

    await screen.findAllByText('Product 16')
    await waitFor(() => expect(list.mock.calls.some(([, page]) => page === 2)).toBe(true))
    expect(list.mock.calls.filter(([, page]) => page <= 2).every(([filters]) => filters.priceMin === 10)).toBe(true)
    expect(
      list.mock.calls.filter(([, page]) => page <= 2).every(([filters]) => filters.isPersonalizable === false)
    ).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const minimumPrice = await screen.findByRole('spinbutton', { name: 'Minimum price' })
    await user.clear(minimumPrice)
    await user.type(minimumPrice, '20')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(list.mock.calls.some(([filters, page]) => filters.priceMin === 20 && page === 1)).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([filters, page]) => page === 1 && filters.priceMin === null && filters.isPersonalizable === null
        )
      ).toBe(true)
    )
  })

  it('does not query draft edits before Apply and commits valid filters on Apply', async () => {
    seedProducts([rawProduct(1)])
    const list = vi.spyOn(productsService, 'list').mockImplementation(listFixture)
    const user = userEvent.setup()

    renderPage()

    await screen.findAllByText('Product 1')
    const appliedRequestCount = list.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Minimum price' }), '20')
    await waitFor(() => expect(list).toHaveBeenCalledTimes(appliedRequestCount))

    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() =>
      expect(list.mock.calls.some(([filters, page]) => filters.priceMin === 20 && page === 1)).toBe(true)
    )
  })

  it('invalid price range marks only price inputs invalid', async () => {
    const user = userEvent.setup()

    renderPage('/dashboard/products?price_min=20&price_max=10')

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(await screen.findAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('spinbutton', { name: 'Minimum price' })).toHaveAttribute(
      'aria-describedby',
      'products-price-range-error'
    )
    expect(screen.getByRole('spinbutton', { name: 'Maximum price' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Created from')).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByLabelText('Created to')).not.toHaveAttribute('aria-describedby')
  })

  it('invalid created range marks only date inputs invalid', async () => {
    const user = userEvent.setup()

    renderPage('/dashboard/products?created_from=2026-10-10&created_to=2026-10-09')

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(await screen.findAllByRole('alert')).toHaveLength(1)
    expect(screen.getByLabelText('Created from')).toHaveAttribute('aria-describedby', 'products-created-range-error')
    expect(screen.getByLabelText('Created to')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('spinbutton', { name: 'Minimum price' })).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByRole('spinbutton', { name: 'Maximum price' })).not.toHaveAttribute('aria-describedby')
  })

  it('keeps invalid draft state open and does not issue a Products request on Apply', async () => {
    seedProducts([rawProduct(1)])
    const list = vi.spyOn(productsService, 'list').mockImplementation(listFixture)
    const user = userEvent.setup()

    renderPage()

    await screen.findAllByText('Product 1')
    const appliedRequestCount = list.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Minimum price' }), '20')
    await user.type(screen.getByRole('spinbutton', { name: 'Maximum price' }), '10')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Minimum price' })).toHaveValue(20)
    expect(screen.getByRole('spinbutton', { name: 'Maximum price' })).toHaveValue(10)
    await waitFor(() => expect(list).toHaveBeenCalledTimes(appliedRequestCount))
  })

  it('navigates from Create and responsive Edit actions', async () => {
    seedProducts([rawProduct(1)])
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Product 1')

    await user.click(screen.getByRole('link', { name: 'Create Product' }))

    expect(await screen.findByText('Product Create destination')).toBeInTheDocument()
  })

  it('navigates Edit to the selected dynamic route', async () => {
    seedProducts([rawProduct(4)])
    const user = userEvent.setup()
    renderPage()
    await user.click((await screen.findAllByRole('button', { name: 'Actions for Product 4' }))[0])
    await user.click(await screen.findByRole('menuitem', { name: 'Edit Product 4' }))
    expect(await screen.findByText('Product Edit destination')).toBeInTheDocument()
  })

  it('requires confirmation, protects duplicate Product deletion, and removes on success', async () => {
    seedProducts([rawProduct(8)])
    const remove = vi.spyOn(productsService, 'delete')
    const user = userEvent.setup()
    renderPage()
    await user.click((await screen.findAllByRole('button', { name: 'Actions for Product 8' }))[0])
    await user.click(await screen.findByRole('menuitem', { name: 'Delete Product 8' }))
    expect(remove).not.toHaveBeenCalled()
    const dialog = await screen.findByRole('alertdialog')
    await user.dblClick(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Product 8')).not.toBeInTheDocument()
  })

  it('keeps the Product and confirmation available after a safe Delete failure', async () => {
    seedProducts([rawProduct(9)])
    vi.spyOn(productsService, 'delete').mockRejectedValueOnce(new Error('unsafe delete detail'))
    const user = userEvent.setup()
    renderPage()
    await user.click((await screen.findAllByRole('button', { name: 'Actions for Product 9' }))[0])
    await user.click(await screen.findByRole('menuitem', { name: 'Delete Product 9' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getAllByText('Product 9')).toHaveLength(2)
    expect(screen.queryByText('unsafe delete detail')).not.toBeInTheDocument()
  })
})
