import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { productMediaService } from '@/modules/products/api/product-media.service'
import { productVariantStocksService } from '@/modules/products/api/product-variant-stocks.service'
import { productVariantsService } from '@/modules/products/api/product-variants.service'
import { ProductVariantsSection } from '@/modules/products/components/ProductVariantsSection'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'
import { seedWarehousesMock } from '@/modules/warehouses/mocks/warehouses.mock'

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

const product: ProductDetail = {
  id: 7,
  categoryId: 1,
  sku: 'PRODUCT',
  name: { ar: 'منتج', en: 'Product' },
  description: { ar: '', en: '' },
  slug: 'product',
  basePrice: 50,
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
  variants: [
    {
      id: 12,
      sku: 'VAR-A',
      attributes: { color: 'silver' },
      priceOverride: null,
      isActive: true,
      images: [
        { id: 121, url: 'one.jpg' },
        { id: 122, url: 'two.jpg' },
      ],
      warehouseStocks: [{ warehouseId: 1, quantity: 5 }],
    },
    {
      id: 13,
      sku: 'VAR-B',
      attributes: { nested: { value: 1 } },
      priceOverride: 75,
      isActive: false,
      images: [],
      warehouseStocks: [{ warehouseId: 3, quantity: 9 }],
    },
  ],
  images: [],
  createdAt: 'created',
  updatedAt: 'updated',
}

function ProductVariantsHarness() {
  const query = useQuery({ queryKey: productsKeys.detail(7), queryFn: async () => product, initialData: product })
  return <ProductVariantsSection product={query.data} />
}

function renderSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ProductVariantsHarness />
    </QueryClientProvider>
  )
  return client
}

describe('ProductVariantsSection', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:variant')
    URL.revokeObjectURL = vi.fn()
    seedWarehousesMock([
      {
        id: 1,
        name: 'Warehouse One',
        coverage_zone: [],
        is_active: true,
        created_at: 'created',
        updated_at: 'updated',
      },
      {
        id: 2,
        name: 'Warehouse Two',
        coverage_zone: [],
        is_active: true,
        created_at: 'created',
        updated_at: 'updated',
      },
      {
        id: 3,
        name: 'Warehouse Three',
        coverage_zone: [],
        is_active: true,
        created_at: 'created',
        updated_at: 'updated',
      },
    ])
    await i18n.changeLanguage('en')
  })

  it('renders flat attributes, complex fallback, price semantics, and no Edit action', () => {
    renderSection()
    expect(screen.getByText('color: silver')).toBeInTheDocument()
    expect(screen.getByText('Complex attributes')).toBeInTheDocument()
    expect(screen.getByText('Uses Product Base Price')).toBeInTheDocument()
    expect(screen.queryByText('Edit Variant')).not.toBeInTheDocument()
  })

  it('creates a Variant from the isolated Drawer form and appends the response', async () => {
    const created = {
      id: 14,
      sku: 'VAR-C',
      attributes: { size: 'large' },
      priceOverride: 80,
      isActive: true,
      images: [],
      warehouseStocks: [],
    }
    const create = vi.spyOn(productVariantsService, 'create').mockResolvedValue(created)
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    const drawer = await screen.findByRole('dialog')
    await user.type(within(drawer).getByRole('textbox', { name: 'SKU' }), ' VAR-C ')
    await user.type(within(drawer).getByRole('textbox', { name: 'Attribute Key' }), ' size ')
    await user.type(within(drawer).getByRole('textbox', { name: 'Attribute Value' }), ' large ')
    await user.type(within(drawer).getByRole('spinbutton', { name: 'Price Override' }), '80')
    await user.click(within(drawer).getByRole('button', { name: 'Create Variant' }))

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(create).toHaveBeenCalledWith(7, {
      sku: 'VAR-C',
      attributes: { size: 'large' },
      priceOverride: 80,
      isActive: true,
      images: [],
    })
    await waitFor(() => expect(screen.getByText('VAR-C')).toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('confirms Variant Delete, prevents duplicates, and removes only the target', async () => {
    let resolveDelete!: (value: { success: boolean; message: string }) => void
    const remove = vi.spyOn(productVariantsService, 'delete').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        })
    )
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Actions for variant VAR-A' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete variant VAR-A' }))
    const confirm = within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete Variant' })
    await user.click(confirm)
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    expect(confirm).toBeDisabled()
    await user.click(confirm)
    expect(remove).toHaveBeenCalledTimes(1)

    await act(async () => resolveDelete({ success: true, message: 'deleted' }))
    await waitFor(() => expect(screen.queryByText('VAR-A')).not.toBeInTheDocument())
    expect(screen.getByText('VAR-B')).toBeInTheDocument()
  })

  it('preserves the Variant after a failed Delete', async () => {
    vi.spyOn(productVariantsService, 'delete').mockRejectedValueOnce(new Error('unsafe'))
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Actions for variant VAR-A' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Delete variant VAR-A' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete Variant' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('VAR-A')).toBeInTheDocument()
    expect(screen.getByText('VAR-B')).toBeInTheDocument()
  })

  it('deletes only targeted Variant media without invalidating Product lists', async () => {
    vi.spyOn(productMediaService, 'delete').mockResolvedValue({ success: true, message: 'deleted' })
    const user = userEvent.setup()
    const client = renderSection()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await user.click(screen.getByRole('button', { name: 'Delete image 121 from variant VAR-A' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete image' }))
    await waitFor(() => expect(screen.queryByAltText('Image 121 for variant VAR-A')).not.toBeInTheDocument())
    expect(screen.getByAltText('Image 122 for variant VAR-A')).toBeInTheDocument()
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('scopes pending media state to the selected image and prevents duplicate deletion', async () => {
    let resolveDelete!: (value: { success: boolean; message: string }) => void
    const remove = vi.spyOn(productMediaService, 'delete').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        })
    )
    const user = userEvent.setup()
    renderSection()
    const first = screen.getByRole('button', { name: 'Delete image 121 from variant VAR-A' })
    const second = screen.getByRole('button', { name: 'Delete image 122 from variant VAR-A' })
    await user.click(first)
    const confirm = within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete image' })
    await user.click(confirm)
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    expect(first).toBeDisabled()
    expect(first.querySelector('.animate-spin')).toBeInTheDocument()
    expect(second).toBeEnabled()
    expect(confirm).toBeDisabled()
    await user.click(confirm)
    expect(remove).toHaveBeenCalledTimes(1)

    await act(async () => resolveDelete({ success: true, message: 'deleted' }))
    await waitFor(() => expect(screen.queryByAltText('Image 121 for variant VAR-A')).not.toBeInTheDocument())
  })

  it('removes an unsaved local Variant image without calling media Delete', async () => {
    const remove = vi.spyOn(productMediaService, 'delete')
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    const drawer = await screen.findByRole('dialog')
    await user.upload(
      within(drawer).getByLabelText('Browse images'),
      new File(['image'], 'local.png', { type: 'image/png' })
    )
    await user.click(await within(drawer).findByRole('button', { name: 'Remove local.png' }))
    expect(remove).not.toHaveBeenCalled()
  })

  it('renders existing stock and adds zero quantity while excluding assigned Warehouses', async () => {
    const put = vi.spyOn(productVariantStocksService, 'put').mockResolvedValue({ warehouseId: 2, quantity: 0 })
    const user = userEvent.setup()
    renderSection()
    const stockRegion = (await screen.findAllByRole('region', { name: 'Stock' }))[0]
    expect(await within(stockRegion).findByText('Warehouse One')).toBeInTheDocument()
    expect(within(stockRegion).getByText('5')).toBeInTheDocument()
    await user.click(within(stockRegion).getByRole('button', { name: 'Add Stock' }))
    const drawer = await screen.findByRole('dialog')
    await user.click(within(drawer).getByRole('combobox', { name: 'Warehouse' }))
    expect(screen.queryByRole('option', { name: 'Warehouse One' })).not.toBeInTheDocument()
    await user.click(await screen.findByRole('option', { name: 'Warehouse Two' }))
    await user.type(within(drawer).getByRole('spinbutton', { name: 'Quantity' }), '0')
    await user.click(within(drawer).getByRole('button', { name: 'Save Stock' }))

    await waitFor(() => expect(put).toHaveBeenCalledWith(7, 12, 2, 0))
    expect(await within(stockRegion).findByText('Warehouse Two')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('edits an existing stock quantity with its Warehouse fixed', async () => {
    const put = vi.spyOn(productVariantStocksService, 'put').mockResolvedValue({ warehouseId: 1, quantity: 0 })
    const user = userEvent.setup()
    renderSection()
    const edit = await screen.findByRole('button', { name: 'Edit quantity for Warehouse One' })
    await user.click(edit)
    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByRole('combobox', { name: 'Warehouse' })).toBeDisabled()
    const quantity = within(drawer).getByRole('spinbutton', { name: 'Quantity' })
    expect(quantity).toHaveValue(5)
    await user.clear(quantity)
    await user.type(quantity, '0')
    await user.click(within(drawer).getByRole('button', { name: 'Save Stock' }))

    await waitFor(() => expect(put).toHaveBeenCalledWith(7, 12, 1, 0))
    expect(await screen.findByRole('button', { name: 'Edit quantity for Warehouse One' })).toBeInTheDocument()
  })

  it('confirms Stock removal, prevents duplicates, and removes only the target stock', async () => {
    let resolveDelete!: (value: { success: boolean; message: string }) => void
    const remove = vi.spyOn(productVariantStocksService, 'delete').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve
        })
    )
    const user = userEvent.setup()
    renderSection()
    await user.click(await screen.findByRole('button', { name: 'Remove stock from Warehouse One' }))
    const confirm = within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remove Stock' })
    await user.click(confirm)
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    expect(confirm).toBeDisabled()
    await user.click(confirm)
    expect(remove).toHaveBeenCalledTimes(1)

    await act(async () => resolveDelete({ success: true, message: 'deleted' }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Remove stock from Warehouse One' })).not.toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: 'Remove stock from Warehouse Three' })).toBeInTheDocument()
  })

  it('preserves Stock after a failed removal', async () => {
    vi.spyOn(productVariantStocksService, 'delete').mockRejectedValueOnce(new Error('unsafe stock detail'))
    const user = userEvent.setup()
    renderSection()
    await user.click(await screen.findByRole('button', { name: 'Remove stock from Warehouse One' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remove Stock' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Remove stock from Warehouse One' })).toBeInTheDocument()
    expect(screen.queryByText('unsafe stock detail')).not.toBeInTheDocument()
  })
})
