import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosHeaders } from 'axios'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'
import { normalizeProductDetail, productsService } from '@/modules/products/api/products.service'
import ProductDetailsPage from '@/modules/products/pages/ProductDetailsPage'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { RawProductDetail } from '@/modules/products/types/product.types'
import en from '@/modules/products/locale/en.json'
import ar from '@/modules/products/locale/ar.json'
import { $http } from '@/utils/http'

const rawProduct: RawProductDetail = {
  id: '7',
  category_id: '2',
  sku: 'GIFT-7',
  name: { ar: 'هدية', en: 'Gift' },
  description: { ar: '<p>وصف الهدية</p>', en: '<h1>A special gift</h1><p>Made with care</p><script>alert(1)</script>' },
  slug: 'gift',
  base_price: '149.50',
  base_price_incl_vat: '171.925',
  discount_percentage: '10',
  discount_end_at: '2026-10-20 10:00:00',
  is_personalizable: true,
  personalization_max_length: 20,
  personalization_fee: '5',
  max_cart_item_quantity: 10,
  is_new_arrival: true,
  is_active: true,
  sort_order: 2,
  simulated_viewers_count: 30,
  simulated_orders_count: 4,
  category: { id: '2', name: { ar: 'هدايا', en: 'Gifts' } },
  images: [
    { id: 11, url: 'https://example.test/main.jpg' },
    { id: 12, url: 'https://example.test/extra.jpg' },
  ],
  variants: [
    {
      id: '9',
      sku: 'GIFT-BLUE',
      attributes: { gift_wrap: 'Blue' },
      price_override: '175',
      is_active: true,
      is_default: true,
      images: [{ id: 13, url: 'https://example.test/variant.jpg' }],
      warehouse_stocks: [{ id: 3, warehouse_id: '4', quantity: '0' }],
    },
  ],
  created_at: '2026-10-01T10:00:00Z',
  updated_at: '2026-10-02T10:00:00Z',
}

function EditDestination() {
  const { id } = useParams()
  return <p>Edit destination {id}</p>
}

function renderPage(id = '7', client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })) {
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/dashboard/products/${id}`]}>
        <Routes>
          <Route path="/dashboard/products/:id" element={<ProductDetailsPage />} />
          <Route path="/dashboard/products/:id/edit" element={<EditDestination />} />
          <Route path="/dashboard/products" element={<p>Products destination</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...result, client }
}

function reply(product: RawProductDetail = rawProduct) {
  return {
    data: { success: true, message: 'ok', data: product },
    status: 200,
    statusText: 'OK',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  }
}

describe('Product details', () => {
  it.each([
    { label: 'populated object', attributes: { color: 'silver', size: 'M' }, expected: { color: 'silver', size: 'M' } },
    { label: 'empty array', attributes: [], expected: {} },
  ])('renders confirmed $label attributes with an absent cart limit', async ({ attributes, expected }) => {
    const response = {
      ...rawProduct,
      variants: [{ ...rawProduct.variants[0], attributes }],
      hide_price_on_packaging: true,
    }
    delete response.max_cart_item_quantity
    vi.mocked($http.get).mockResolvedValue(reply(response))
    const { client } = renderPage()

    expect(await screen.findByRole('heading', { name: 'Gift', level: 1 })).toBeInTheDocument()
    const variants = screen.getByRole('region', { name: 'Variants' })
    expect(within(variants).getByRole('heading', { name: 'GIFT-BLUE' })).toBeInTheDocument()
    if ('color' in expected) {
      expect(within(variants).getByText('silver')).toBeInTheDocument()
      expect(within(variants).getByText('M')).toBeInTheDocument()
    } else {
      expect(within(variants).getByText('No attributes')).toBeInTheDocument()
    }
    expect(client.getQueryData(productsKeys.detail(7))).toMatchObject({
      variants: [{ id: 9, attributes: expected }],
      maxCartItemQuantity: null,
    })
    expect(screen.queryByTestId('query-state-loading-error')).not.toBeInTheDocument()
    expect(screen.getByText('Maximum Cart Item Quantity').closest('div')?.querySelector('dd')).toHaveTextContent('—')
  })
  it.each([undefined, null, 10])('renders a compatible Show response with cart quantity limit %s', async (limit) => {
    const response = { ...rawProduct, max_cart_item_quantity: limit, hide_price_on_packaging: true }
    if (limit === undefined) delete response.max_cart_item_quantity
    vi.mocked($http.get).mockResolvedValue(reply(response))
    const { client } = renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Gift' })).toBeInTheDocument()
    const fact = screen.getByText('Maximum Cart Item Quantity').closest('div')
    expect(fact?.querySelector('dd')).toHaveTextContent(limit == null ? '—' : '10')
    expect(screen.queryByTestId('query-state-loading-error')).not.toBeInTheDocument()
    expect(client.getQueryData(productsKeys.detail(7))).not.toHaveProperty('hidePriceOnPackaging')
    expect(screen.queryByText('Hide Price on Packaging')).not.toBeInTheDocument()
  })
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn($http, 'get').mockResolvedValue(reply())
    vi.spyOn(productsService, 'show')
  })
  afterEach(() => vi.restoreAllMocks())

  it('uses the canonical Show service, endpoint and detail cache without lookup requests', async () => {
    const { client } = renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Gift' })).toBeInTheDocument()
    expect(productsService.show).toHaveBeenCalledExactlyOnceWith(7, expect.any(AbortSignal))
    expect($http.get).toHaveBeenCalledTimes(1)
    expect($http.get).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/products/7', signal: expect.any(AbortSignal) })
    )
    expect(client.getQueryData(productsKeys.detail(7))).toEqual(normalizeProductDetail(rawProduct))
    expect(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey)
    ).toEqual([productsKeys.detail(7)])
  })

  it('renders semantic core information, sanitized descriptions, media, variants and zero stock', async () => {
    const { container } = renderPage()
    await screen.findByRole('heading', { level: 1, name: 'Gift' })
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByText('Gifts')).toBeInTheDocument()
    expect(screen.getByText('149.5')).toBeInTheDocument()
    expect(screen.getByText('171.925')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('A special gift')).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(screen.getAllByRole('img', { name: 'Image of Gift' })).toHaveLength(2)
    expect(screen.getByRole('img', { name: 'Image of Gift — GIFT-BLUE' })).toBeInTheDocument()
    const variants = screen.getByRole('region', { name: 'Variants' })
    expect(within(variants).getByText('Gift Wrap')).toBeInTheDocument()
    expect(within(variants).getByText('Blue')).toBeInTheDocument()
    expect(within(variants).getByText('175')).toBeInTheDocument()
    expect(within(variants).getByText('Default')).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Inventory' })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
    expect(within(table).getByRole('cell', { name: 'Warehouse #4' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '0' })).toBeInTheDocument()
    expect(container.querySelectorAll('dl dt').length).toBeGreaterThan(10)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('uses the same ordered sections and responsive structures in the mirror skeleton', async () => {
    let resolve!: (value: ReturnType<typeof reply>) => void
    vi.mocked($http.get).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { container } = renderPage()
    expect(screen.getByTestId('query-loading-state')).toHaveAttribute('aria-busy', 'true')
    expect(within(screen.getByTestId('query-loading-state')).queryByRole('link', { hidden: true })).toBeNull()
    const headings = Array.from(container.querySelectorAll('h2'), (heading) => heading.textContent)
    const structures = ['section', 'dl', 'dt', 'table', 'thead', '[data-slot="responsive-data-mobile-cards"]']
    const counts = structures.map((selector) => container.querySelectorAll(selector).length)
    expect(headings).toEqual([
      'Product Images',
      'Overview',
      'Pricing & Discount',
      'Product Settings',
      'Activity & Metadata',
      'Variants',
      'Inventory',
    ])
    const twoRows = {
      ...rawProduct,
      variants: [...rawProduct.variants, { ...rawProduct.variants[0], id: 10, sku: 'SECOND' }],
    }
    await act(async () => resolve(reply(twoRows)))
    await screen.findByRole('heading', { name: 'Gift', level: 1 })
    expect(Array.from(container.querySelectorAll('h2'), (heading) => heading.textContent)).toEqual(headings)
    expect(structures.map((selector) => container.querySelectorAll(selector).length)).toEqual(counts)
    expect(screen.queryByTestId('query-loading-state')).not.toBeInTheDocument()
  })

  it('reads cached Edit data immediately while the existing freshness policy refetches once', async () => {
    vi.mocked($http.get).mockImplementation(() => new Promise(() => {}))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    client.setQueryData(productsKeys.detail(7), normalizeProductDetail(rawProduct))
    renderPage('7', client)
    expect(screen.getByRole('heading', { name: 'Gift', level: 1 })).toBeInTheDocument()
    expect(screen.queryByTestId('query-loading-state')).not.toBeInTheDocument()
    await waitFor(() => expect($http.get).toHaveBeenCalledTimes(1))
  })

  it.each(['bad', '0', '-1', '1.5', '1e2', '9007199254740992'])(
    'rejects invalid ID %s without requesting Show',
    (id) => {
      renderPage(id)
      expect(screen.getByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Back to Products' })).toHaveAttribute('href', '/dashboard/products')
      expect(productsService.show).not.toHaveBeenCalled()
    }
  )

  it('keeps the product visible when optional sections are empty', async () => {
    vi.mocked($http.get).mockResolvedValue(
      reply({ ...rawProduct, images: [], variants: [], category: null, description: [], discount_percentage: null })
    )
    renderPage()
    await screen.findByRole('heading', { name: 'Gift', level: 1 })
    expect(screen.getByRole('img', { name: 'No product image' })).toBeInTheDocument()
    expect(screen.getByText('No variants have been added.')).toBeInTheDocument()
    expect(screen.getByText('No stock assigned.')).toBeInTheDocument()
    expect(screen.queryByText(/null|undefined/)).not.toBeInTheDocument()
  })

  it('renders an empty attribute and stock state without inventing variant prices', async () => {
    vi.mocked($http.get).mockResolvedValue(
      reply({
        ...rawProduct,
        variants: [
          { ...rawProduct.variants[0], attributes: null, warehouse_stocks: [], price_override: null, is_active: false },
        ],
      })
    )
    renderPage()
    await screen.findByRole('heading', { name: 'Gift', level: 1 })
    expect(screen.getByText('No attributes')).toBeInTheDocument()
    expect(screen.getByText('Uses Product Base Price')).toBeInTheDocument()
    expect(screen.getByText('No stock assigned.')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('replaces broken media with the existing intentional fallback', async () => {
    renderPage()
    const images = await screen.findAllByRole('img', { name: 'Image of Gift' })
    fireEvent.error(images[0])
    expect(screen.getByRole('img', { name: 'No product image' })).toBeInTheDocument()
  })

  it('renders Arabic names, category, description and accessible navigation', async () => {
    await i18n.changeLanguage('ar')
    renderPage()
    expect(await screen.findByRole('heading', { name: 'هدية', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('هدايا')).toBeInTheDocument()
    expect(screen.getByText('وصف الهدية')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: i18n.t('products.actions.editNamed', { name: 'هدية' }) })).toHaveAttribute(
      'href',
      '/dashboard/products/7/edit'
    )
    expect(screen.getAllByRole('img', { name: i18n.t('products.imageAlt', { name: 'هدية' }) })).toHaveLength(2)
  })

  it('falls back to the available localized product name', async () => {
    vi.mocked($http.get).mockResolvedValue(reply({ ...rawProduct, name: { en: '', ar: 'هدية' } }))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'هدية', level: 1 })).toBeInTheDocument()
  })

  it('offers a safe initial error, retry, and back navigation', async () => {
    vi.mocked($http.get).mockRejectedValueOnce(new Error('private backend details'))
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('private backend details')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Products' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: i18n.t('queryState.actions.retry') }))
    expect(await screen.findByRole('heading', { name: 'Gift', level: 1 })).toBeInTheDocument()
    expect($http.get).toHaveBeenCalledTimes(2)
  })

  it('distinguishes a missing product from a generic failure', async () => {
    vi.mocked($http.get).mockRejectedValue({ isAxiosError: true, response: { status: 404 } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Product not found' })).toBeInTheDocument()
    expect(screen.queryByTestId('query-loading-state')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('retains visible data on background failure and recovers through retry', async () => {
    const user = userEvent.setup()
    const { client } = renderPage()
    await screen.findByRole('heading', { name: 'Gift', level: 1 })
    vi.mocked($http.get).mockRejectedValueOnce({ isAxiosError: true, response: { status: 404 } })
    await act(async () => {
      await client.invalidateQueries({ queryKey: productsKeys.detail(7), exact: true })
    })
    expect(await screen.findByTestId('query-state-refetch-error')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Gift', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Product not found' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: i18n.t('queryState.actions.retry') }))
    await waitFor(() => expect(screen.queryByTestId('query-state-refetch-error')).not.toBeInTheDocument())
  })

  it('navigates to the existing Edit route without manually fetching Show', async () => {
    const user = userEvent.setup()
    renderPage()
    const edit = await screen.findByRole('link', { name: 'Edit Gift' })
    await user.tab()
    expect(screen.getByRole('link', { name: 'Back to Products' })).toHaveFocus()
    await user.tab()
    expect(edit).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Edit destination 7')).toBeInTheDocument()
    expect(productsService.show).toHaveBeenCalledTimes(1)
  })

  it('keeps Arabic and English detail/action translation keys aligned', () => {
    expect(Object.keys(ar.products.details).sort()).toEqual(Object.keys(en.products.details).sort())
    expect(Object.keys(ar.products.details.notFound).sort()).toEqual(Object.keys(en.products.details.notFound).sort())
    expect(Object.keys(ar.products.actions).sort()).toEqual(Object.keys(en.products.actions).sort())
  })
})
