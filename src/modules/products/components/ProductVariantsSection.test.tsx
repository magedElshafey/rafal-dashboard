import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
      attributes: { color: '#C0C0C0' },
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
      attributes: { color: 'red' },
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

function ProductVariantsHarness({ initialProduct }: { initialProduct: ProductDetail }) {
  const query = useQuery({
    queryKey: productsKeys.detail(initialProduct.id),
    queryFn: async () => initialProduct,
    initialData: initialProduct,
  })
  return <ProductVariantsSection product={query.data} />
}

function renderSection(initialProduct = product) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ProductVariantsHarness initialProduct={initialProduct} />
    </QueryClientProvider>
  )
  return client
}

describe('ProductVariantsSection', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:variant')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(warehousesService, 'list').mockResolvedValue({
      items: [
        { id: 1, name: 'Warehouse One', isActive: true, createdAt: 'created', updatedAt: 'updated' },
        { id: 2, name: 'Warehouse Two', isActive: true, createdAt: 'created', updatedAt: 'updated' },
        { id: 3, name: 'Warehouse Three', isActive: true, createdAt: 'created', updatedAt: 'updated' },
      ],
      paginate: {
        current_page: 1,
        total_pages: 1,
        per_page: 15,
        total: 3,
        count: 3,
        next_page_url: null,
        prev_page_url: null,
      },
      extra: null,
    })
    await i18n.changeLanguage('en')
  })

  it('renders valid color swatches, historic invalid color as text, effective price, and Edit actions', () => {
    renderSection()
    expect(screen.getByText('#C0C0C0')).toBeInTheDocument()
    expect(screen.getAllByText('Attributes')[1].parentElement).toHaveTextContent(/Color:\s+red/)
    expect(document.querySelector('[style*="background-color: red"]')).not.toBeInTheDocument()
    expect(screen.getByText(/Uses Product Base Price/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Actions for variant/ })).toHaveLength(2)
  })

  it('creates a Variant from the isolated Drawer form and appends the response', async () => {
    const created = {
      id: 14,
      sku: 'VAR-C',
      attributes: { any_thing_else: 'Test value' },
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
    await user.type(within(drawer).getByRole('textbox', { name: 'Attribute Key' }), ' Any thing else ')
    await user.type(within(drawer).getByRole('textbox', { name: 'Attribute Value' }), ' Test value ')
    await user.type(within(drawer).getByRole('spinbutton', { name: 'Price Override' }), '80')
    await user.click(within(drawer).getByRole('button', { name: 'Create Variant' }))

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(create).toHaveBeenCalledWith(7, {
      sku: 'VAR-C',
      attributes: { any_thing_else: 'Test value' },
      priceOverride: 80,
      isActive: true,
      images: [],
    })
    await waitFor(() => expect(screen.getByText('VAR-C')).toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('uses the color input for Color and submits canonical six-digit HEX', async () => {
    const created = {
      id: 15,
      sku: 'VAR-COLOR',
      attributes: { color: '#C8102E' },
      priceOverride: null,
      isActive: true,
      images: [],
      warehouseStocks: [],
    }
    const create = vi.spyOn(productVariantsService, 'create').mockResolvedValue(created)
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    const drawer = await screen.findByRole('dialog')
    await user.type(within(drawer).getByRole('textbox', { name: 'SKU' }), 'VAR-COLOR')
    await user.type(within(drawer).getByRole('textbox', { name: 'Attribute Key' }), 'Color')
    const value = within(drawer).getByLabelText('Attribute Value')
    expect(value).toHaveAttribute('type', 'color')
    fireEvent.change(value, { target: { value: '#c8102e' } })
    expect(within(drawer).getByText('#C8102E')).toBeInTheDocument()
    await user.click(within(drawer).getByRole('button', { name: 'Create Variant' }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(7, {
        sku: 'VAR-COLOR',
        attributes: { color: '#C8102E' },
        priceOverride: null,
        isActive: true,
        images: [],
      })
    )
  })

  it('prevents duplicate Variant Create submissions while the first request is pending', async () => {
    let resolveCreate!: (value: ProductDetail['variants'][number]) => void
    const create = vi.spyOn(productVariantsService, 'create').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        })
    )
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))
    const drawer = await screen.findByRole('dialog')
    await user.type(within(drawer).getByRole('textbox', { name: 'SKU' }), 'VAR-PENDING')
    const submit = within(drawer).getByRole('button', { name: 'Create Variant' })
    await user.click(submit)
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(create).toHaveBeenCalledTimes(1)

    await act(async () =>
      resolveCreate({
        id: 16,
        sku: 'VAR-PENDING',
        attributes: {},
        priceOverride: null,
        isActive: true,
        images: [],
        warehouseStocks: [],
      })
    )
  })

  it('edits a Variant independently with a partial payload', async () => {
    const update = vi.spyOn(productVariantsService, 'update').mockResolvedValue({
      ...product.variants[0],
      sku: 'VAR-A2',
    })
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Actions for variant VAR-A' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit variant VAR-A' }))
    const drawer = await screen.findByRole('dialog')
    const sku = within(drawer).getByRole('textbox', { name: 'SKU' })
    await user.clear(sku)
    await user.type(sku, 'VAR-A2')
    await user.click(within(drawer).getByRole('button', { name: 'Update Variant' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith(7, 12, { sku: 'VAR-A2' }))
    expect(await screen.findByText('VAR-A2')).toBeInTheDocument()
  })

  it('allows an SKU-only edit with unchanged legacy color text and omits attributes', async () => {
    const update = vi.spyOn(productVariantsService, 'update').mockResolvedValue({
      ...product.variants[1],
      sku: 'VAR-B2',
    })
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Actions for variant VAR-B' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit variant VAR-B' }))
    const drawer = await screen.findByRole('dialog')
    expect(within(drawer).getByLabelText('Attribute Value')).toHaveAttribute('type', 'text')
    const sku = within(drawer).getByRole('textbox', { name: 'SKU' })
    await user.clear(sku)
    await user.type(sku, 'VAR-B2')
    await user.click(within(drawer).getByRole('button', { name: 'Update Variant' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith(7, 13, { sku: 'VAR-B2' }))
  })

  it('rejects changing legacy color text to another non-HEX value', async () => {
    const update = vi.spyOn(productVariantsService, 'update')
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Actions for variant VAR-B' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit variant VAR-B' }))
    const drawer = await screen.findByRole('dialog')
    const value = within(drawer).getByLabelText('Attribute Value')
    await user.clear(value)
    await user.type(value, 'blue')
    await user.click(within(drawer).getByRole('button', { name: 'Update Variant' }))

    expect(update).not.toHaveBeenCalled()
    expect(within(drawer).getByRole('button', { name: 'Update Variant' })).toBeInTheDocument()
  })

  it('accepts changing legacy color text to canonical HEX and sends only color', async () => {
    const update = vi.spyOn(productVariantsService, 'update').mockResolvedValue({
      ...product.variants[1],
      attributes: { color: '#FF0000' },
    })
    const user = userEvent.setup()
    renderSection()
    await user.click(screen.getByRole('button', { name: 'Actions for variant VAR-B' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit variant VAR-B' }))
    const drawer = await screen.findByRole('dialog')
    fireEvent.change(within(drawer).getByLabelText('Attribute Value'), { target: { value: '#ff0000' } })
    await user.click(within(drawer).getByRole('button', { name: 'Update Variant' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith(7, 13, { attributes: { color: '#FF0000' } }))
  })

  it('renders and hydrates an existing Unicode key without renaming or resending it', async () => {
    const unicodeKey = 'تيست_تيست_تيست'
    const unicodeProduct: ProductDetail = {
      ...product,
      variants: [
        {
          ...product.variants[0],
          sku: 'VAR-UNICODE',
          attributes: { size: '16', color: '#1D5259', any_thing: 'فسيبسي', [unicodeKey]: '11117' },
        },
      ],
    }
    const update = vi.spyOn(productVariantsService, 'update').mockResolvedValue({
      ...unicodeProduct.variants[0],
      sku: 'VAR-UNICODE-2',
    })
    const user = userEvent.setup()
    renderSection(unicodeProduct)
    expect(screen.getByText('Attributes').parentElement).toHaveTextContent(/تيست تيست تيست:\s+11117/)
    await user.click(screen.getByRole('button', { name: 'Actions for variant VAR-UNICODE' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit variant VAR-UNICODE' }))
    const drawer = await screen.findByRole('dialog')
    const unicodeKeyInput = within(drawer).getAllByRole('textbox', { name: 'Attribute Key' })[3]
    expect(unicodeKeyInput).toBeDisabled()
    expect(unicodeKeyInput).toHaveValue(unicodeKey)
    const sku = within(drawer).getByRole('textbox', { name: 'SKU' })
    await user.clear(sku)
    await user.type(sku, 'VAR-UNICODE-2')
    await user.click(within(drawer).getByRole('button', { name: 'Update Variant' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith(7, 12, { sku: 'VAR-UNICODE-2' }))
  })

  it('sends a changed existing Unicode value under the exact persisted key', async () => {
    const unicodeKey = 'تيست_تيست_تيست'
    const unicodeProduct: ProductDetail = {
      ...product,
      variants: [{ ...product.variants[0], sku: 'VAR-UNICODE', attributes: { [unicodeKey]: '11117' } }],
    }
    const update = vi.spyOn(productVariantsService, 'update').mockResolvedValue({
      ...unicodeProduct.variants[0],
      attributes: { [unicodeKey]: '22222' },
    })
    const user = userEvent.setup()
    renderSection(unicodeProduct)
    await user.click(screen.getByRole('button', { name: 'Actions for variant VAR-UNICODE' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit variant VAR-UNICODE' }))
    const drawer = await screen.findByRole('dialog')
    const value = within(drawer).getByRole('textbox', { name: 'Attribute Value' })
    await user.clear(value)
    await user.type(value, '22222')
    await user.click(within(drawer).getByRole('button', { name: 'Update Variant' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith(7, 12, { attributes: { [unicodeKey]: '22222' } }))
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
