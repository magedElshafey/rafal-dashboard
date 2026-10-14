import { normalizeInventoryFilters } from '../utils/inventory-filters'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { QuickStocktakeDrawer } from '@/modules/inventory/components/QuickStocktakeDrawer'
import { inventoryKeys } from '@/modules/inventory/queries/inventory.keys'
import WarehouseInventoryPage from '@/modules/warehouses/pages/WarehouseInventoryPage'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { inventoryService } from '@/modules/inventory/api/inventory.service'
import { productsService } from '@/modules/products/api/products.service'
import { productVariantStocksService } from '@/modules/products/api/product-variant-stocks.service'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { ProductDetail } from '@/modules/products/types/product.types'
import { inventoryPage, warehouseFixture } from './inventory.fixtures'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))
const stock = { ...inventoryPage().items[0], quantity: 100 }

function product(quantity = 100, stockId = stock.id): ProductDetail {
  return {
    ...stock.product,
    categoryId: null,
    slug: 'synthetic',
    description: { ar: '', en: '' },
    basePrice: 10,
    discountPercentage: null,
    discountEndAt: null,
    isPersonalizable: false,
    personalizationMaxLength: null,
    personalizationFee: null,
    maxCartItemQuantity: 10,
    isNewArrival: false,
    sortOrder: 0,
    simulatedViewersCount: 0,
    simulatedOrdersCount: 0,
    images: [],
    createdAt: stock.updatedAt,
    updatedAt: stock.updatedAt,
    variants: [
      {
        ...stock.variant,
        priceOverride: null,
        images: [],
        warehouseStocks: [{ id: stockId, warehouseId: stock.warehouse.id, quantity }],
      },
    ],
  }
}

function renderDrawer(record = stock) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 60000 }, mutations: { retry: false } },
  })
  client.setQueryData(inventoryKeys.list(6, 1), inventoryPage())
  const close = vi.fn()
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <QuickStocktakeDrawer stock={record} onClose={close} />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...result, client, close }
}

function count(value: string) {
  fireEvent.change(screen.getByRole('spinbutton', { name: /Physical Count/i }), { target: { value } })
}
async function review() {
  fireEvent.click(screen.getByRole('button', { name: 'Review stock update' }))
  return screen.findByRole('heading', { name: 'Confirm Stock Update' })
}

describe('Quick Stocktake', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    toast.success.mockReset()
    toast.error.mockReset()
    await i18n.changeLanguage('en')
    vi.spyOn(productsService, 'show').mockResolvedValue(product())
    vi.spyOn(productVariantStocksService, 'put').mockImplementation(
      async (_product, _variant, warehouseId, quantity) => ({ id: stock.id, warehouseId, quantity })
    )
    vi.spyOn(productVariantStocksService, 'delete').mockResolvedValue({ success: true, message: 'unused' })
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
    HTMLElement.prototype.setPointerCapture = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()
  })

  it('preloads exact identities with a labeled, described and focused count input without fetching every card', async () => {
    renderDrawer()
    expect(screen.getByRole('dialog', { name: 'Quick Stocktake' })).toBeInTheDocument()
    expect(screen.getByText('White Musk Perfume')).toBeInTheDocument()
    expect(screen.getByText('VAR-45')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText('Warehouse 6')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toHaveValue(null)
    expect(screen.getByRole('spinbutton')).toHaveAccessibleDescription(i18n.t('inventory.stocktake.countHelp'))
    await waitFor(() => expect(screen.getByRole('spinbutton')).toHaveFocus())
    expect(productsService.show).not.toHaveBeenCalled()
  })

  it.each([
    ['93', 'Shortage · 7 units'],
    ['107', 'Surplus · 7 units'],
    ['100', 'No change'],
    ['93.0', 'Shortage · 7 units'],
    ['1e2', 'No change'],
  ])('calculates the variance for %s without a request', (value, expected) => {
    renderDrawer()
    count(value)
    expect(screen.getByRole('status')).toHaveTextContent(expected)
    expect(productVariantStocksService.put).not.toHaveBeenCalled()
  })

  it.each([
    ['en', 99, 'Shortage · 1 unit'],
    ['en', 101, 'Surplus · 1 unit'],
    ['en', 98, 'Shortage · 2 units'],
    ['en', 102, 'Surplus · 2 units'],
    ['ar', 99, 'عجز · وحدة واحدة'],
    ['ar', 101, 'فائض · وحدة واحدة'],
    ['ar', 98, 'عجز · وحدتان'],
    ['ar', 102, 'فائض · وحدتان'],
    ['ar', 97, 'عجز · {quantity} وحدات'],
    ['ar', 103, 'فائض · {quantity} وحدات'],
    ['ar', 89, 'عجز · {quantity} وحدة'],
    ['ar', 111, 'فائض · {quantity} وحدة'],
    ['ar', 0, 'عجز · {quantity} وحدة'],
    ['ar', 200, 'فائض · {quantity} وحدة'],
    ['ar', 100, 'لا يوجد فرق'],
  ])('uses %s plural rules for physical count %s', async (language, value, expected) => {
    await i18n.changeLanguage(String(language))
    renderDrawer()
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: String(value) } })
    expect(screen.getByRole('status')).toHaveTextContent(
      String(expected).replace(
        '{quantity}',
        new Intl.NumberFormat(String(language)).format(Math.abs(Number(value) - 100))
      )
    )
    expect(productsService.show).not.toHaveBeenCalled()
    expect(productVariantStocksService.put).not.toHaveBeenCalled()
  })

  it.each(['93', '107', '0'])(
    'confirms and submits absolute quantity %s, preserving all three endpoint identities and invalidating caches',
    async (value) => {
      const { client, close } = renderDrawer()
      count(value)
      const heading = await review()
      expect(heading).toHaveFocus()
      expect(
        screen.getByText(new RegExp(`Replace the recorded quantity of 100 with the physical count of ${value}`))
      ).toBeInTheDocument()
      expect(productVariantStocksService.put).not.toHaveBeenCalled()
      expect(productsService.show).toHaveBeenCalledTimes(1)
      fireEvent.submit(document.getElementById('inventory-stocktake-form')!)
      expect(productVariantStocksService.put).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'Confirm replacement' }))
      await waitFor(() => expect(close).toHaveBeenCalledOnce())
      expect(productsService.show).toHaveBeenCalledTimes(2)
      expect(productVariantStocksService.put).toHaveBeenCalledExactlyOnceWith(22, 45, 6, Number(value), {
        suppressForbiddenRedirect: true,
        revalidateProduct: true,
      })
      expect(productVariantStocksService.delete).not.toHaveBeenCalled()
      expect(client.getQueryState(inventoryKeys.list(6, 1))?.isInvalidated).toBe(true)
      expect(client.getQueryState(productsKeys.detail(22))?.isInvalidated).toBe(true)
      expect(client.getQueryData<ProductDetail>(productsKeys.detail(22))?.variants[0].warehouseStocks[0].quantity).toBe(
        Number(value)
      )
    }
  )

  it.each(['', '-1', '1.5', '9007199254740992'])(
    'rejects invalid physical count %s before any read or write',
    async (value) => {
      renderDrawer()
      count(value)
      fireEvent.click(screen.getByRole('button', { name: 'Review stock update' }))
      await waitFor(() => expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true'))
      expect(productsService.show).not.toHaveBeenCalled()
      expect(productVariantStocksService.put).not.toHaveBeenCalled()
    }
  )

  it('checks the balance but does not submit a no-change count', async () => {
    renderDrawer()
    count('100')
    fireEvent.click(screen.getByRole('button', { name: 'Review stock update' }))
    await screen.findByText('Your physical count matches the recorded quantity. No update is needed.')
    expect(screen.queryByRole('button', { name: 'Confirm replacement' })).not.toBeInTheDocument()
    expect(productVariantStocksService.put).not.toHaveBeenCalled()
    count('93')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Shortage · 7 units')
  })

  it('preserves the count and requires review again when stock changed before review or confirmation', async () => {
    vi.mocked(productsService.show)
      .mockResolvedValueOnce(product(97))
      .mockResolvedValueOnce(product(97))
      .mockResolvedValueOnce(product(92))
      .mockResolvedValue(product(92))
    renderDrawer()
    count('93')
    fireEvent.click(screen.getByRole('button', { name: 'Review stock update' }))
    await screen.findByText(/Recorded stock changed while you were counting/)
    expect(screen.getByText('97')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton')).toHaveValue(93)
    expect(screen.getByRole('status')).toHaveTextContent('Shortage · 4 units')
    await review()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm replacement' }))
    await screen.findByText(/Recorded stock changed while you were counting/)
    expect(screen.getByText('92')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Surplus · 1 unit')
    expect(screen.getByRole('spinbutton')).toHaveValue(93)
    expect(productVariantStocksService.put).not.toHaveBeenCalled()
    await review()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm replacement' }))
    await waitFor(() => expect(productVariantStocksService.put).toHaveBeenCalledOnce())
  })

  it('blocks duplicate confirm clicks and closing during the SET request', async () => {
    let finish!: (value: { id: number; warehouseId: number; quantity: number }) => void
    vi.mocked(productVariantStocksService.put).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      })
    )
    const { close } = renderDrawer()
    count('93')
    await review()
    const confirm = screen.getByRole('button', { name: 'Confirm replacement' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await waitFor(() => expect(productVariantStocksService.put).toHaveBeenCalledOnce())
    expect(screen.getByRole('button', { name: 'Close stocktake' })).toBeDisabled()
    expect(screen.getByRole('spinbutton')).toBeDisabled()
    expect(close).not.toHaveBeenCalled()
    await act(async () => finish({ id: 172, warehouseId: 6, quantity: 93 }))
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
  })

  it.each([403, 422, 500, 'network'])(
    'retains the draft after %s and applies quantity validation errors',
    async (status) => {
      vi.mocked(productVariantStocksService.put).mockRejectedValueOnce(
        status === 'network'
          ? new Error('private')
          : {
              isAxiosError: true,
              response: { status, data: { errors: status === 422 ? { quantity: ['Count rejected'] } : undefined } },
            }
      )
      const { client, close } = renderDrawer()
      count('93')
      await review()
      fireEvent.click(screen.getByRole('button', { name: 'Confirm replacement' }))
      await waitFor(() => expect(screen.getByRole('spinbutton')).toBeEnabled())
      expect(screen.getByRole('spinbutton')).toHaveValue(93)
      await waitFor(() => expect(screen.getByRole('spinbutton')).toHaveFocus())
      expect(close).not.toHaveBeenCalled()
      expect(client.getQueryData(inventoryKeys.list(6, 1))).toEqual(inventoryPage())
      expect(client.getQueryState(inventoryKeys.list(6, 1))?.isInvalidated).toBe(false)
      if (status === 422) {
        expect(screen.getByText('Count rejected')).toBeInTheDocument()
        expect(screen.getByRole('spinbutton')).toHaveAccessibleDescription(
          `${i18n.t('inventory.stocktake.countHelp')} Count rejected`
        )
      }
      if (status === 403) expect(screen.getByRole('alert')).toHaveTextContent('You do not have permission')
      await review()
      fireEvent.click(screen.getByRole('button', { name: 'Confirm replacement' }))
      await waitFor(() => expect(close).toHaveBeenCalledOnce())
    }
  )

  it.each(['absent', 'replaced', 'forbidden', 'network'] as const)(
    'does not SET when the fresh balance is %s',
    async (kind) => {
      if (kind === 'absent') vi.mocked(productsService.show).mockResolvedValue({ ...product(), variants: [] })
      if (kind === 'replaced') vi.mocked(productsService.show).mockResolvedValue(product(100, 999))
      if (kind === 'forbidden')
        vi.mocked(productsService.show).mockRejectedValue({ isAxiosError: true, response: { status: 403 } })
      if (kind === 'network') vi.mocked(productsService.show).mockRejectedValue(new Error('internal details'))
      renderDrawer()
      count('93')
      fireEvent.click(screen.getByRole('button', { name: 'Review stock update' }))
      await screen.findByRole('alert')
      expect(screen.getByRole('spinbutton')).toHaveValue(93)
      expect(screen.queryByText('internal details')).not.toBeInTheDocument()
      expect(productVariantStocksService.put).not.toHaveBeenCalled()
    }
  )

  it('cancels a pending confirmation read on unmount without applying a later write', async () => {
    let finish!: (value: ProductDetail) => void
    vi.mocked(productsService.show)
      .mockResolvedValueOnce(product())
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          })
      )
    const { unmount } = renderDrawer()
    count('93')
    await review()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm replacement' }))
    await waitFor(() => expect(productsService.show).toHaveBeenCalledTimes(2))
    unmount()
    await act(async () => finish(product()))
    expect(productVariantStocksService.put).not.toHaveBeenCalled()
  })

  it('targets the selected warehouse when the same variant is stocked in two warehouses', async () => {
    const otherStock = { ...stock, id: 174, warehouse: { id: 8, name: 'Warehouse 8' } }
    const detail = product()
    detail.variants[0].warehouseStocks.push({ id: 174, warehouseId: 8, quantity: 100 })
    vi.mocked(productsService.show).mockResolvedValue(detail)
    vi.mocked(productVariantStocksService.put).mockResolvedValue({ id: 174, warehouseId: 8, quantity: 93 })
    const { client, close } = renderDrawer(otherStock)
    client.setQueryData(inventoryKeys.list(6, 2), inventoryPage(2, 2, 6))
    client.setQueryData(inventoryKeys.list(8, 1), inventoryPage(1, 2, 8))
    count('93')
    await review()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm replacement' }))
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    expect(productVariantStocksService.put).toHaveBeenCalledExactlyOnceWith(22, 45, 8, 93, {
      suppressForbiddenRedirect: true,
      revalidateProduct: true,
    })
    expect(client.getQueryData<ProductDetail>(productsKeys.detail(22))?.variants[0].warehouseStocks).toEqual([
      { id: 172, warehouseId: 6, quantity: 100 },
      { id: 174, warehouseId: 8, quantity: 93 },
    ])
    for (const key of [inventoryKeys.list(6, 1), inventoryKeys.list(6, 2), inventoryKeys.list(8, 1)]) {
      expect(client.getQueryState(key)?.isInvalidated).toBe(true)
    }
    expect(productVariantStocksService.delete).not.toHaveBeenCalled()
  })

  it('keeps the drawer keyboard-operable and localized in Arabic', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderDrawer()
    const dialog = screen.getByRole('dialog', { name: 'جرد سريع' })
    expect(within(dialog).getByRole('spinbutton', { name: 'الكمية الفعلية' })).toHaveAttribute('dir', 'ltr')
    expect(within(dialog).getByText('عطر مسك أبيض')).toBeInTheDocument()
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '93' } })
    await user.click(screen.getByRole('button', { name: 'مراجعة تحديث المخزون' }))
    expect(await screen.findByRole('heading', { name: 'تأكيد تحديث المخزون' })).toHaveFocus()
    expect(screen.getByRole('status')).toHaveTextContent('عجز')
  })

  it.each([false, true])(
    'restores card focus after saving, preserving authoritative data when refresh failure is %s',
    async (refreshFails) => {
      let quantity = 88
      vi.spyOn(warehousesService, 'show').mockResolvedValue({ success: true, message: 'ok', data: warehouseFixture() })
      vi.spyOn(inventoryService, 'list').mockImplementation(async () => ({
        ...inventoryPage(2, 2),
        items: [{ ...stock, quantity }],
      }))
      vi.mocked(productsService.show).mockImplementation(async () => product(quantity))
      vi.mocked(productVariantStocksService.put).mockImplementation(
        async (_product, _variant, warehouseId, counted) => {
          quantity = counted
          return { id: stock.id, warehouseId, quantity }
        }
      )
      const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
      const user = userEvent.setup()
      render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/dashboard/warehouses/6/inventory?page=2&product_id=22&stock_status=in_stock&sort_by=quantity&sort_dir=asc']}>
            <Routes>
              <Route path="/dashboard/warehouses/:id/inventory" element={<WarehouseInventoryPage />} />
            </Routes>
            <Location />
          </MemoryRouter>
        </QueryClientProvider>
      )
      const trigger = await screen.findByRole('button', { name: 'Quick Stocktake for VAR-45 in Warehouse 6' })
      await user.click(trigger)
      expect(productsService.show).not.toHaveBeenCalled()
      count('80')
      await review()
      if (refreshFails) vi.mocked(inventoryService.list).mockRejectedValueOnce(new Error('refresh unavailable'))
      await user.click(screen.getByRole('button', { name: 'Confirm replacement' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(within(screen.getByRole('article')).getByText(refreshFails ? '88' : '80')).toBeInTheDocument()
      if (refreshFails)
        expect(screen.getByRole('button', { name: i18n.t('queryState.actions.retry') })).toBeInTheDocument()
      expect(inventoryService.list).toHaveBeenCalledTimes(2)
      expect(inventoryService.list).toHaveBeenLastCalledWith(6, 2, expect.any(AbortSignal), normalizeInventoryFilters({ productId: 22, stockStatus: 'in_stock', sortBy: 'quantity', sortDir: 'asc' }))
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/warehouses/6/inventory?page=2')
      expect(trigger).toHaveFocus()
    }
  )
})

function Location() {
  const location = useLocation()
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  )
}
