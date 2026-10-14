import { normalizeInventoryFilters } from '../utils/inventory-filters'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosHeaders } from 'axios'
import i18n from '@/config/i18'
import WarehouseInventoryPage from '@/modules/warehouses/pages/WarehouseInventoryPage'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { inventoryService, parseInventoryResponse } from '@/modules/inventory/api/inventory.service'
import { inventoryKeys } from '@/modules/inventory/queries/inventory.keys'
import { inventoryPage, rawResponse, rawStock, warehouseFixture } from './inventory.fixtures'
import { $http } from '@/utils/http'

const productQueries = vi.hoisted(() => ({ list: vi.fn(), detail: vi.fn() }))
vi.mock('@/modules/products/hooks/useProducts', () => ({ useProducts: () => productQueries.list() }))
vi.mock('@/modules/products/hooks/useProduct', () => ({ useProduct: (id: number | null) => productQueries.detail(id) }))

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output data-testid="location">
        {location.pathname}
        {location.search}
      </output>
      <Link to="/dashboard/warehouses/8/inventory">Warehouse B</Link>
      <button onClick={() => navigate(-1)}>Browser back</button>
      <button onClick={() => navigate(1)}>Browser forward</button>
    </>
  )
}
function renderWorkspace(entry = '/dashboard/warehouses/6/inventory') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 60000 } } })
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Navigation />
        <Routes>
          <Route path="/dashboard/warehouses/:id/inventory" element={<WarehouseInventoryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...result, client }
}

describe('Warehouse inventory workspace', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} })
    Element.prototype.scrollIntoView = vi.fn()
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
    HTMLElement.prototype.setPointerCapture = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()
    productQueries.list.mockReturnValue({
      data: { pages: [{ items: [rawStock().product] }] }, isLoading: false, isFetching: false,
      isError: false, hasNextPage: false,
    })
    productQueries.detail.mockImplementation((id: number | null) => ({
      data: id ? { ...rawStock().product, id } : undefined, isLoading: false, isFetching: false, isError: false,
    }))
    await i18n.changeLanguage('en')
    vi.spyOn(warehousesService, 'show').mockImplementation(async (id) => ({
      success: true,
      message: 'ok',
      data: warehouseFixture(id),
    }))
    vi.spyOn(inventoryService, 'list').mockImplementation(async (id, page) => inventoryPage(page, 2, id))
  })

  afterEach(() => vi.unstubAllGlobals())

  it.each(['en', 'ar'])('restores localized filter controls and an off-page product label in %s', async language => {
    await i18n.changeLanguage(language)
    const user = userEvent.setup()
    renderWorkspace('/dashboard/warehouses/6/inventory?page=2&product_id=44&stock_status=low_stock&sort_by=updated_at&sort_dir=desc&search=Musk')
    await screen.findByRole('article')
    expect(inventoryService.list).toHaveBeenLastCalledWith(6, 2, expect.any(AbortSignal), normalizeInventoryFilters({
      productId: 44, stockStatus: 'low_stock', sortBy: 'updated_at', sortDir: 'desc', search: 'Musk',
    }))
    expect(screen.getByRole('textbox', { name: i18n.t('inventory.filters.search') })).toHaveValue('Musk')
    await user.click(screen.getByRole('button', { name: i18n.t('inventory.filters.active', { count: 5 }) }))
    const product = screen.getByRole('combobox', { name: i18n.t('inventory.fields.product') })
    expect(product).toHaveTextContent(language === 'ar' ? rawStock().product.name.ar : rawStock().product.name.en)
    expect(productQueries.detail).toHaveBeenCalledWith(44)
    expect(screen.getByRole('combobox', { name: i18n.t('inventory.fields.status') })).toHaveTextContent(i18n.t('inventory.status.lowStock'))
    await user.click(screen.getByRole('combobox', { name: i18n.t('inventory.filters.sortBy') }))
    expect(screen.getByRole('option', { name: i18n.t('inventory.filters.sort.quantity') })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: i18n.t('inventory.fields.warehouse') })).not.toBeInTheDocument()
  })

  it('applies drafts atomically at page one, preserves filters on paging/history, and resets only owned parameters', async () => {
    const user = userEvent.setup()
    renderWorkspace('/dashboard/warehouses/6/inventory?page=2&search=Musk&product_id=22&keep=yes')
    await screen.findByText('Page 2 of 2')
    await user.click(screen.getByRole('button', { name: 'Filters (2)' }))
    await user.click(screen.getByRole('combobox', { name: 'Stock status' }))
    await user.click(screen.getByRole('option', { name: 'Low stock' }))
    await user.click(screen.getByRole('combobox', { name: 'Sort by' }))
    await user.click(screen.getByRole('option', { name: 'Quantity' }))
    await user.click(screen.getByRole('combobox', { name: 'Sort direction' }))
    await user.click(screen.getByRole('option', { name: 'Descending' }))
    expect(inventoryService.list).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await screen.findByText('Page 1 of 2')
    const filters = normalizeInventoryFilters({ search: 'Musk', productId: 22, stockStatus: 'low_stock', sortBy: 'quantity', sortDir: 'desc' })
    expect(inventoryService.list).toHaveBeenCalledTimes(2)
    expect(inventoryService.list).toHaveBeenLastCalledWith(6, 1, expect.any(AbortSignal), filters)
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    await screen.findByText('Page 2 of 2')
    expect(inventoryService.list).toHaveBeenLastCalledWith(6, 2, expect.any(AbortSignal), filters)
    await user.click(screen.getByRole('button', { name: 'Browser back' }))
    await screen.findByText('Page 1 of 2')
    expect(screen.getByTestId('location')).toHaveTextContent('stock_status=low_stock')
    await user.click(screen.getByRole('button', { name: 'Filters (5)' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() => expect(inventoryService.list).toHaveBeenLastCalledWith(6, 1, expect.any(AbortSignal), normalizeInventoryFilters()))
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/warehouses/6/inventory?keep=yes')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Browser back' }))
    await waitFor(() => expect(screen.getByRole('textbox', { name: i18n.t('inventory.filters.search') })).toHaveValue('Musk'))
    await user.click(screen.getByRole('link', { name: 'Warehouse B' }))
    await screen.findByRole('heading', { name: 'Warehouse 8' })
    await waitFor(() => expect(inventoryService.list).toHaveBeenLastCalledWith(8, 1, expect.any(AbortSignal), normalizeInventoryFilters()))
  })

  it('debounces backend search and resets page while preserving an applied product', async () => {
    const user = userEvent.setup()
    renderWorkspace('/dashboard/warehouses/6/inventory?page=2&product_id=22')
    await screen.findByText('Page 2 of 2')
    await user.type(screen.getByRole('textbox', { name: i18n.t('inventory.filters.search') }), 'VAR-45')
    expect(inventoryService.list).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(inventoryService.list).toHaveBeenLastCalledWith(6, 1, expect.any(AbortSignal), normalizeInventoryFilters({ search: 'VAR-45', productId: 22 })))
    expect(inventoryService.list).toHaveBeenCalledTimes(2)
  })

  it('loads product pages inside the dropdown and clears product selection in the draft', async () => {
    const more = vi.fn()
    productQueries.list.mockReturnValue({ data: { pages: [{ items: [rawStock().product] }] }, hasNextPage: true,
      isLoading: false, isFetching: false, isError: false, fetchNextPage: more })
    const user = userEvent.setup()
    renderWorkspace('/dashboard/warehouses/6/inventory?product_id=22')
    await screen.findByRole('article')
    await user.click(screen.getByRole('button', { name: 'Filters (1)' }))
    expect(more).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Load more products' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('combobox', { name: 'Product' }))
    const viewport = screen.getByRole('listbox')
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, value: 600 },
      clientHeight: { configurable: true, value: 300 },
      scrollTop: { configurable: true, value: 270 },
    })
    fireEvent.scroll(viewport)
    await waitFor(() => expect(more).toHaveBeenCalledTimes(1))
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Clear product' }))
    expect(inventoryService.list).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(inventoryService.list).toHaveBeenLastCalledWith(6, 1, expect.any(AbortSignal), normalizeInventoryFilters()))
  })

  it.each(['en', 'ar'])('does not describe sorting-only results as filtered in %s', async language => {
    await i18n.changeLanguage(language)
    vi.mocked(inventoryService.list).mockResolvedValue(parseInventoryResponse({
      ...rawResponse([]), meta: { ...rawResponse([]).meta, total: 0 },
    }))
    renderWorkspace('/dashboard/warehouses/6/inventory?sort_by=quantity&sort_dir=desc')
    await screen.findByText(i18n.t('inventory.empty.title'))
    expect(screen.getByText(i18n.t('inventory.totalRecords'))).toBeInTheDocument()
    expect(screen.queryByText(i18n.t('inventory.filters.totalRecords'))).not.toBeInTheDocument()
    expect(screen.queryByText(i18n.t('inventory.filters.emptyTitle'))).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: i18n.t('inventory.filters.active', { count: 2 }) })).toBeInTheDocument()
  })

  it('deduplicates product identities from overlapping pages without clearing the selected product', async () => {
    productQueries.list.mockReturnValue({
      data: { pages: [{ items: [rawStock().product] }, { items: [rawStock().product] }] },
      hasNextPage: false, isLoading: false, isFetching: false, isError: false,
    })
    const user = userEvent.setup()
    renderWorkspace('/dashboard/warehouses/6/inventory?product_id=22')
    await screen.findByRole('article')
    await user.click(screen.getByRole('button', { name: 'Filters (1)' }))
    await user.click(screen.getByRole('combobox', { name: 'Product' }))
    expect(screen.getAllByRole('option', { name: /White Musk Perfume/ })).toHaveLength(1)
    await user.keyboard('{Escape}')
    expect(screen.getByRole('combobox', { name: 'Product' })).toHaveTextContent('White Musk Perfume')
    expect(inventoryService.list).toHaveBeenCalledTimes(1)
  })

  it('loads identity and stock separately and preserves exact record/variant attributes and navigation', async () => {
    vi.mocked(inventoryService.list).mockResolvedValue(
      parseInventoryResponse(rawResponse([rawStock(), rawStock(174, 6, 46)]))
    )
    renderWorkspace()
    const cards = await screen.findAllByRole('article')
    expect(warehousesService.show).toHaveBeenCalledExactlyOnceWith(6, expect.any(AbortSignal))
    expect(inventoryService.list).toHaveBeenCalledExactlyOnceWith(6, 1, expect.any(AbortSignal), normalizeInventoryFilters())
    expect(screen.getByRole('heading', { name: 'Warehouse 6' })).toBeInTheDocument()
    expect(screen.getByText('Riyadh')).toBeInTheDocument()
    expect(screen.getByText('Stock records · this warehouse')).toBeInTheDocument()
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveAttribute('data-stock-id', '172')
    expect(cards[1]).toHaveAttribute('data-stock-id', '174')
    expect(within(cards[0]).getByRole('link', { name: 'White Musk Perfume' })).toHaveAttribute(
      'href',
      '/dashboard/products/22'
    )
    expect(within(cards[1]).getByRole('link', { name: /View variant VAR-46/ })).toHaveAttribute(
      'href',
      '/dashboard/products/22?variant=46&warehouse=6#variant-46'
    )
    for (const key of ['length', 'lenth', 'Size', 'size']) expect(within(cards[0]).getByText(key)).toBeInTheDocument()
    expect(within(cards[0]).getByRole('button', { name: 'Quick Stocktake for VAR-45 in Warehouse 6' })).toBeEnabled()
    expect(screen.queryByText(/unavailable|not the complete inventory/i)).not.toBeInTheDocument()
  })

  it('uses server pages and URL history with warehouse/page cache isolation', async () => {
    const user = userEvent.setup()
    const { client } = renderWorkspace()
    await screen.findByText('Page 1 of 2')
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled()
    expect(inventoryService.list).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Go to next page' }))
    await screen.findByText('Page 2 of 2')
    expect(screen.getByRole('article')).toHaveAttribute('data-stock-id', '173')
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/warehouses/6/inventory?page=2')
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled()
    expect(client.getQueryData(inventoryKeys.list(6, 1))).toEqual(inventoryPage(1, 2))
    expect(client.getQueryData(inventoryKeys.list(6, 2))).toEqual(inventoryPage(2, 2))
    await user.click(screen.getByRole('button', { name: 'Browser back' }))
    await screen.findByText('Page 1 of 2')
    await user.click(screen.getByRole('button', { name: 'Browser forward' }))
    await screen.findByText('Page 2 of 2')
    await user.click(screen.getByRole('link', { name: 'Warehouse B' }))
    await screen.findByRole('heading', { name: 'Warehouse 8' })
    await screen.findByText('Page 1 of 2')
    expect(inventoryService.list).toHaveBeenLastCalledWith(8, 1, expect.any(AbortSignal), normalizeInventoryFilters())
    expect(client.getQueryData(inventoryKeys.list(8, 1))).toEqual(inventoryPage(1, 2, 8))
    expect(screen.getByTestId('location')).not.toHaveTextContent('?page=2')
    expect(screen.getByRole('button', { name: 'Quick Stocktake for VAR-45 in Warehouse 8' })).toBeEnabled()
  })

  it.each(['0', '-1', '1.5', 'abc', '9007199254740992', 'Infinity', ''])(
    'normalizes invalid page %s without making an invalid request',
    async (page) => {
      renderWorkspace(`/dashboard/warehouses/6/inventory?page=${page}&warehouse_id=8&search=VAR`)
      await screen.findByRole('article')
      expect(inventoryService.list).toHaveBeenCalledExactlyOnceWith(6, 1, expect.any(AbortSignal), normalizeInventoryFilters({ search: 'VAR' }))
      expect(screen.getByTestId('location')).toHaveTextContent('page=1')
    }
  )

  it.each([0, -1, 1.5, 9007199254740992])('does not request identity or stock for invalid warehouse %s', async (id) => {
    renderWorkspace(`/dashboard/warehouses/${id}/inventory`)
    expect(screen.getByText('Warehouse not found')).toBeInTheDocument()
    expect(warehousesService.show).not.toHaveBeenCalled()
    expect(inventoryService.list).not.toHaveBeenCalled()
  })

  it('corrects out-of-range pages using returned metadata, including after a stock refresh', async () => {
    vi.mocked(inventoryService.list).mockImplementation(async (id, page) =>
      page > 2 ? parseInventoryResponse(rawResponse([], page, 2)) : inventoryPage(page, 2, id)
    )
    renderWorkspace('/dashboard/warehouses/6/inventory?page=9')
    await screen.findByText('Page 2 of 2')
    expect(vi.mocked(inventoryService.list).mock.calls.map(([, page]) => page)).toEqual([9, 2])
    expect(screen.getByTestId('location')).toHaveTextContent('page=2')
    vi.mocked(inventoryService.list).mockImplementation(async (_id, page) =>
      parseInventoryResponse({ ...rawResponse([], page, 1), meta: { ...rawResponse([], page, 1).meta, total: 0 } })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    await screen.findByText('No stock records in this warehouse')
    expect(screen.getByTestId('location')).toHaveTextContent('page=1')
    expect(inventoryService.list).toHaveBeenLastCalledWith(6, 1, expect.any(AbortSignal), normalizeInventoryFilters())
  })

  it('cancels a departed scope and never renders its late response under another warehouse', async () => {
    let finish!: (value: ReturnType<typeof inventoryPage>) => void
    let signal!: AbortSignal
    vi.mocked(inventoryService.list).mockImplementation((id, page, requestSignal) => {
      if (id === 8) return Promise.resolve(inventoryPage(page, 2, id))
      signal = requestSignal!
      return new Promise((resolve) => {
        finish = resolve
      })
    })
    renderWorkspace('/dashboard/warehouses/6/inventory?page=2')
    await waitFor(() => expect(inventoryService.list).toHaveBeenCalledOnce())
    fireEvent.click(screen.getByRole('link', { name: 'Warehouse B' }))
    await screen.findByRole('article')
    expect(signal.aborted).toBe(true)
    await act(async () => finish(inventoryPage(2, 2, 6)))
    expect(screen.getByRole('button', { name: /Quick Stocktake/ })).toHaveAccessibleName(
      'Quick Stocktake for VAR-45 in Warehouse 8'
    )
  })

  it('rejects a real service response from another warehouse and recovers on retry', async () => {
    vi.mocked(inventoryService.list).mockRestore()
    const reply = (data: unknown) => ({
      data,
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    })
    vi.spyOn($http, 'get')
      .mockResolvedValueOnce(reply(rawResponse([rawStock(173, 8)])))
      .mockResolvedValue(reply(rawResponse([rawStock()])))
    renderWorkspace()
    const retry = await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') })
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.queryByText('No stock records in this warehouse')).not.toBeInTheDocument()
    fireEvent.click(retry)
    await screen.findByRole('article')
  })

  it.each([403, 500])('shows a recoverable inventory error for %s without treating it as empty', async (status) => {
    vi.mocked(inventoryService.list).mockRejectedValue({ isAxiosError: true, response: { status } })
    renderWorkspace()
    const retry = await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') })
    expect(screen.queryByText('No stock records in this warehouse')).not.toBeInTheDocument()
    vi.mocked(inventoryService.list).mockResolvedValue(inventoryPage())
    fireEvent.click(retry)
    await screen.findByRole('article')
    vi.mocked(inventoryService.list).mockRejectedValue(new Error('background'))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') })
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  it('blocks stock requests for a mismatched warehouse identity response', async () => {
    vi.mocked(warehousesService.show).mockResolvedValue({ success: true, message: 'ok', data: warehouseFixture(8) })
    renderWorkspace()
    await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') })
    expect(screen.queryByRole('heading', { name: 'Warehouse 8' })).not.toBeInTheDocument()
    expect(inventoryService.list).not.toHaveBeenCalled()
  })

  it.each([
    ['en', 'Refresh data', 'Refreshing data…'],
    ['ar', 'تحديث البيانات', 'جارٍ تحديث البيانات…'],
  ])(
    'refreshes only the current warehouse/page with localized pending feedback in %s',
    async (language, label, pendingLabel) => {
      await i18n.changeLanguage(language)
      const put = vi.spyOn($http, 'put').mockRejectedValue(new Error('Unexpected mutation'))
      const remove = vi.spyOn($http, 'delete').mockRejectedValue(new Error('Unexpected mutation'))
      renderWorkspace('/dashboard/warehouses/8/inventory?page=2')
      await screen.findByRole('article')
      let fail!: (error: Error) => void
      vi.mocked(inventoryService.list).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            fail = reject
          })
      )
      const refresh = screen.getByRole('button', { name: label })
      expect(refresh).toHaveAccessibleDescription(i18n.t('inventory.refreshDescription'))
      fireEvent.click(refresh)
      const pending = await screen.findByRole('button', { name: pendingLabel })
      expect(pending).toBeDisabled()
      expect(pending.querySelector('svg')).toHaveClass('motion-safe:animate-spin')
      fireEvent.click(pending)
      expect(inventoryService.list).toHaveBeenCalledTimes(2)
      expect(inventoryService.list).toHaveBeenLastCalledWith(8, 2, expect.any(AbortSignal), normalizeInventoryFilters())
      expect(warehousesService.show).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('article')).toHaveAttribute('data-stock-id', '173')
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/warehouses/8/inventory?page=2')
      await act(async () => fail(new Error('offline')))
      const retry = await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') })
      expect(screen.getByRole('article')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: label })).toBeEnabled()
      fireEvent.click(retry)
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: i18n.t('queryState.actions.retry') })).not.toBeInTheDocument()
      )
      expect(inventoryService.list).toHaveBeenCalledTimes(3)
      expect(inventoryService.list).toHaveBeenLastCalledWith(8, 2, expect.any(AbortSignal), normalizeInventoryFilters())
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/warehouses/8/inventory?page=2')
      expect(put).not.toHaveBeenCalled()
      expect(remove).not.toHaveBeenCalled()
    }
  )

  it('distinguishes empty warehouse from empty page and retains background errors for an empty cache', async () => {
    vi.mocked(inventoryService.list).mockResolvedValue(parseInventoryResponse(rawResponse([])))
    renderWorkspace()
    await screen.findByText('No stock records on this page')
    vi.mocked(inventoryService.list).mockResolvedValue(
      parseInventoryResponse({ ...rawResponse([]), meta: { ...rawResponse().meta, total: 0 } })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    await screen.findByText('No stock records in this warehouse')
    vi.mocked(inventoryService.list).mockRejectedValue(new Error('offline'))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') })
    expect(screen.getByText('No stock records in this warehouse')).toBeInTheDocument()
  })

  it('mirrors stock loading, retains backend statuses and threshold precision, and localizes RTL', async () => {
    let finish!: (value: ReturnType<typeof inventoryPage>) => void
    vi.mocked(inventoryService.list).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      })
    )
    await i18n.changeLanguage('ar')
    const { container } = renderWorkspace()
    await waitFor(() => expect(container.querySelectorAll('article')).toHaveLength(15))
    await waitFor(() => expect(inventoryService.list).toHaveBeenCalledOnce())
    expect(container.querySelectorAll('article footer')).toHaveLength(15)
    expect(container.querySelector('p div')).toBeNull()
    const raw = rawStock()
    const data = parseInventoryResponse({
      ...rawResponse([{ ...raw, stock_status: 'pending_audit', product: { ...raw.product, is_active: false } }]),
      meta: { ...rawResponse().meta, low_stock_threshold: 0.00001 },
    })
    await act(async () => finish(data))
    expect(screen.getByRole('main')).toHaveAttribute('dir', 'rtl')
    expect(await screen.findByText('pending_audit')).toBeInTheDocument()
    expect(screen.getByText('VAR-45')).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText(i18n.t('inventory.inactive'))).toBeInTheDocument()
    expect(
      screen.getByText(new Intl.NumberFormat('ar', { maximumFractionDigits: 20 }).format(0.00001))
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /جرد سريع/ })).toBeEnabled()
  })
})
