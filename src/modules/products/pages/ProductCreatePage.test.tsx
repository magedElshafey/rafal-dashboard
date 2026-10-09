import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { categoriesService } from '@/modules/categories/api/categories.service'
import { productsService } from '@/modules/products/api/products.service'
import { productVariantsService } from '@/modules/products/api/product-variants.service'
import { productVariantStocksService } from '@/modules/products/api/product-variant-stocks.service'
import ProductCreatePage from '@/modules/products/pages/ProductCreatePage'
import { productsKeys } from '@/modules/products/queries/products.keys'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)
Element.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
HTMLElement.prototype.setPointerCapture = vi.fn()
HTMLElement.prototype.releasePointerCapture = vi.fn()

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard/products/new']}>
        <Routes>
          <Route path="/dashboard/products/new" element={<ProductCreatePage />} />
          <Route path="/dashboard/products" element={<p>Products Index destination</p>} />
          <Route path="/dashboard/products/:id/edit" element={<p>Product Edit destination</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { queryClient, invalidate }
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>, includeImage = true) {
  await user.click(screen.getByRole('combobox', { name: 'Category' }))
  await user.click(await screen.findByRole('option', { name: 'Jewelry' }))
  await user.type(screen.getByRole('textbox', { name: 'SKU' }), ' RFL-NEW ')
  await user.type(screen.getByRole('textbox', { name: 'Arabic Name' }), ' منتج جديد ')
  await user.type(screen.getByRole('spinbutton', { name: 'Base Price' }), '25.5')
  if (includeImage) {
    await user.upload(screen.getByLabelText('Browse images'), new File(['image'], 'product.png', { type: 'image/png' }))
  }
}

async function addValidVariant(user: ReturnType<typeof userEvent.setup>, sku = 'VAR-ONE') {
  await user.click(screen.getByRole('button', { name: 'Add Variant' }))
  const skuInputs = screen.getAllByRole('textbox', { name: 'SKU' })
  await user.type(skuInputs[skuInputs.length - 1], sku)
}

describe('ProductCreatePage', () => {
  beforeEach(async () => {
    URL.createObjectURL = vi.fn(() => 'blob:product')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(categoriesService, 'list').mockResolvedValue({
      items: [
        {
          id: 1,
          parent_id: null,
          name: { ar: 'مجوهرات', en: 'Jewelry' },
          slug: 'jewelry',
          description: null,
          is_active: true,
          sort_order: 1,
          image_url: 'https://example.test/jewelry.jpg',
          children_count: 0,
          created_at: '2026-09-06T20:01:03+00:00',
          updated_at: '2026-09-06T20:01:03+00:00',
        },
      ],
      paginate: {
        current_page: 1,
        total_pages: 1,
        per_page: 15,
        total: 1,
        count: 1,
        next_page_url: null,
        prev_page_url: null,
      },
      extra: null,
    })
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    vi.spyOn(warehousesService, 'list').mockResolvedValue({
      items: [
        { id: 1, name: 'Main Warehouse', isActive: true, createdAt: 'created', updatedAt: 'updated' },
        { id: 2, name: 'Second Warehouse', isActive: true, createdAt: 'created', updatedAt: 'updated' },
      ],
      paginate: {
        current_page: 1,
        total_pages: 1,
        per_page: 15,
        total: 2,
        count: 2,
        next_page_url: null,
        prev_page_url: null,
      },
      extra: null,
    })
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders the full-page Create sections and uses the established paginated Category selector', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.getByRole('heading', { name: 'Create Product', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Basic Information' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pricing & Discount' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Personalization' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Product Images' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Product Settings' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /slug/i })).not.toBeInTheDocument()

    const category = screen.getByRole('combobox', { name: 'Category' })
    await user.click(category)
    await user.click(await screen.findByRole('option', { name: 'Jewelry' }))
    expect(category).toHaveTextContent('Jewelry')
  })

  it('requires personalization length when enabled and clears dependent values when disabled', async () => {
    const user = userEvent.setup()
    const create = vi.spyOn(productsService, 'create')
    renderPage()
    await fillRequiredFields(user)
    const toggle = screen.getByRole('switch', { name: 'Personalizable' })
    const maxLength = screen.getByRole('spinbutton', { name: 'Maximum Personalization Length' })
    const fee = screen.getByRole('spinbutton', { name: 'Personalization Fee' })

    expect(maxLength).toBeDisabled()
    expect(fee).toBeDisabled()
    await user.click(toggle)
    expect(maxLength).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Create Product' }))
    await waitFor(() => expect(maxLength).toHaveAttribute('aria-invalid', 'true'))
    expect(create).not.toHaveBeenCalled()

    await user.type(maxLength, '12')
    await user.type(fee, '3.5')
    await user.click(toggle)
    expect(maxLength).toBeDisabled()
    expect(fee).toBeDisabled()
    expect(maxLength).toHaveValue(null)
    expect(fee).toHaveValue(null)
  })

  it('preserves entered values and hides raw details when Create fails', async () => {
    vi.spyOn(productsService, 'create').mockRejectedValueOnce(new Error('unsafe database stack detail'))
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)
    await addValidVariant(user)

    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('Product could not be created. Your changes have been preserved.')
    )
    expect(screen.getAllByRole('textbox', { name: 'SKU' })[0]).toHaveValue(' RFL-NEW ')
    expect(screen.getByRole('textbox', { name: 'Arabic Name' })).toHaveValue(' منتج جديد ')
    expect(screen.getByRole('spinbutton', { name: 'Base Price' })).toHaveValue(25.5)
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Jewelry')
    expect(screen.queryByText('unsafe database stack detail')).not.toBeInTheDocument()
  })

  it('maps Laravel bracket, dot, and image wildcard validation keys to form fields', async () => {
    vi.spyOn(productsService, 'create').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          errors: {
            'name[ar]': ['Arabic name from server'],
            'description.en': ['English description from server'],
            'images.0': ['Image from server'],
          },
        },
      },
    })
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)
    await addValidVariant(user)

    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('Arabic name from server')).toBeInTheDocument()
    expect(screen.getByText('English description from server')).toBeInTheDocument()
    expect(screen.getByText('Image from server')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Arabic Name' })).toHaveValue(' منتج جديد ')
  })

  it('requires a Product image before submitting', async () => {
    const create = vi.spyOn(productsService, 'create')
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user, false)

    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('Upload at least one product image.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('requires an explicit Variant, preserves Product values, and clears the section error once valid', async () => {
    const create = vi.spyOn(productsService, 'create')
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('At least one variant is required.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
    expect(screen.getAllByRole('textbox', { name: 'SKU' })[0]).toHaveValue(' RFL-NEW ')
    expect(screen.getByRole('textbox', { name: 'Arabic Name' })).toHaveValue(' منتج جديد ')

    await addValidVariant(user)

    await waitFor(() => expect(screen.queryByText('At least one variant is required.')).not.toBeInTheDocument())
  })

  it('submits exactly one valid Variant in one aggregate Product request', async () => {
    const create = vi.spyOn(productsService, 'create').mockResolvedValueOnce({ id: 89 })
    const createVariant = vi.spyOn(productVariantsService, 'create')
    const putStock = vi.spyOn(productVariantStocksService, 'put')
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)
    await addValidVariant(user)

    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: [expect.objectContaining({ sku: 'VAR-ONE', stocks: [] })],
      })
    )
    expect(createVariant).not.toHaveBeenCalled()
    expect(putStock).not.toHaveBeenCalled()
  })

  it('builds independent Variant, Attribute, and Stock rows in the single Create form', async () => {
    const create = vi.spyOn(productsService, 'create').mockResolvedValueOnce({ id: 90 })
    const createVariant = vi.spyOn(productVariantsService, 'create')
    const putStock = vi.spyOn(productVariantStocksService, 'put')
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    await user.type(screen.getAllByRole('textbox', { name: 'SKU' })[1], 'VAR-RED')
    await user.type(screen.getByRole('textbox', { name: 'Attribute Key' }), 'Color')
    fireEvent.change(screen.getByLabelText('Attribute Value'), { target: { value: '#c8102e' } })
    await user.click(screen.getByRole('button', { name: 'Add Stock' }))
    await user.click(screen.getByRole('combobox', { name: 'Warehouse' }))
    await user.click(await screen.findByRole('option', { name: 'Main Warehouse' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Quantity' }), '0')

    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    await user.type(screen.getAllByRole('textbox', { name: 'SKU' })[2], 'VAR-BLUE')
    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        variants: [
          expect.objectContaining({
            sku: 'VAR-RED',
            attributes: { color: '#C8102E' },
            stocks: [{ warehouseId: 1, quantity: 0 }],
          }),
          expect.objectContaining({ sku: 'VAR-BLUE', stocks: [] }),
        ],
      })
    )
    expect(createVariant).not.toHaveBeenCalled()
    expect(putStock).not.toHaveBeenCalled()
    expect(warehousesService.list).toHaveBeenCalledTimes(1)
  })

  it('removes dynamic rows and prevents duplicate Warehouse selection within a Variant', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    expect(screen.getAllByText(/Variant \d/)).toHaveLength(2)
    await user.click(screen.getAllByRole('button', { name: 'Remove Variant' })[1])
    expect(screen.getAllByText(/Variant \d/)).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Add Stock' }))
    await user.click(screen.getByRole('combobox', { name: 'Warehouse' }))
    await user.click(await screen.findByRole('option', { name: 'Main Warehouse' }))
    await user.click(screen.getByRole('button', { name: 'Add Stock' }))
    await user.click(screen.getAllByRole('combobox', { name: 'Warehouse' })[1])
    expect(screen.queryByRole('option', { name: 'Main Warehouse' })).not.toBeInTheDocument()
    expect(await screen.findByRole('option', { name: 'Second Warehouse' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(screen.getAllByRole('button', { name: /Remove stock row/ })[1])
    expect(screen.getAllByRole('combobox', { name: 'Warehouse' })).toHaveLength(1)
  })

  it('maps a nested Laravel Warehouse error to the exact Stock selector and preserves values', async () => {
    vi.spyOn(productsService, 'create').mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { errors: { 'variants.0.stocks.0.warehouse_id': ['Warehouse is unavailable'] } } },
    })
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    await user.type(screen.getAllByRole('textbox', { name: 'SKU' })[1], 'VAR-ONE')
    await user.click(screen.getByRole('button', { name: 'Add Stock' }))
    await user.click(screen.getByRole('combobox', { name: 'Warehouse' }))
    await user.click(await screen.findByRole('option', { name: 'Main Warehouse' }))
    await user.type(screen.getByRole('spinbutton', { name: 'Quantity' }), '4')
    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('Warehouse is unavailable')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox', { name: 'SKU' })[1]).toHaveValue('VAR-ONE')
    expect(screen.getByRole('spinbutton', { name: 'Quantity' })).toHaveValue(4)
  })

  it('maps aggregate Variant pricing, active, and Attribute errors to their exact controls', async () => {
    vi.spyOn(productsService, 'create').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          errors: {
            'variants.0.price_override': ['Price override is invalid'],
            'variants.0.is_active': ['Variant active state is invalid'],
            'variants.0.attributes.color': ['Variant color is invalid'],
          },
        },
      },
    })
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    await user.type(screen.getAllByRole('textbox', { name: 'SKU' })[1], 'VAR-COLOR')
    await user.type(screen.getByRole('textbox', { name: 'Attribute Key' }), 'Color')
    fireEvent.change(screen.getByLabelText('Attribute Value'), { target: { value: '#c8102e' } })
    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('Price override is invalid')).toBeInTheDocument()
    expect(screen.getByText('Variant active state is invalid')).toBeInTheDocument()
    expect(screen.getByText('Variant color is invalid')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Price Override' })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByRole('checkbox', { name: 'Active' })[1]).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Attribute Value')).toHaveAttribute('aria-invalid', 'true')
  })

  it('locks aggregate submission while the Product POST is pending', async () => {
    let resolveCreate!: (value: { id: number }) => void
    const create = vi.spyOn(productsService, 'create').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        })
    )
    const user = userEvent.setup()
    renderPage()
    await fillRequiredFields(user)
    await addValidVariant(user)
    const submit = screen.getByRole('button', { name: 'Create Product' })

    await user.click(submit)
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(create).toHaveBeenCalledTimes(1)

    await act(async () => resolveCreate({ id: 91 }))
    expect(await screen.findByText('Product Edit destination')).toBeInTheDocument()
  })

  it('invalidates Product lists and navigates to the created Product Edit page', async () => {
    const create = vi.spyOn(productsService, 'create').mockResolvedValueOnce({ id: 88 })
    const user = userEvent.setup()
    const { invalidate } = renderPage()
    await fillRequiredFields(user)
    await addValidVariant(user)

    await user.click(screen.getByRole('button', { name: 'Create Product' }))

    expect(await screen.findByText('Product Edit destination')).toBeInTheDocument()
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 1,
        sku: 'RFL-NEW',
        name: { ar: 'منتج جديد', en: '' },
        basePrice: 25.5,
        sortOrder: 0,
        images: [expect.any(File)],
      })
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: productsKeys.lists() })
    expect(toastMocks.success).toHaveBeenCalledWith('Product created successfully.')
  })
})
