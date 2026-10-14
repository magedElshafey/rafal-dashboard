import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import InventoryPage from '@/modules/inventory/pages/InventoryPage'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { inventoryService } from '@/modules/inventory/api/inventory.service'
import { warehouseListPage } from './inventory.fixtures'

vi.mock('@/hooks/queries/useInfiniteScroll', () => ({ useInfiniteScroll: () => ({ current: null }) }))
function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>
}
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Location />
        <InventoryPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Inventory warehouse directory', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await i18n.changeLanguage('en')
    vi.spyOn(warehousesService, 'list').mockResolvedValue(warehouseListPage([6, 8]))
    vi.spyOn(warehousesService, 'show')
    vi.spyOn(inventoryService, 'list')
  })

  it('uses warehouse cards with exact workspace links and no CRUD or fabricated stock metrics', async () => {
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Warehouse 6' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Warehouse 8' })).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open inventory for Warehouse 6' })).toHaveAttribute(
      'href',
      '/dashboard/warehouses/6/inventory'
    )
    expect(screen.getByRole('link', { name: 'Open inventory for Warehouse 8' })).toHaveAttribute(
      'href',
      '/dashboard/warehouses/8/inventory'
    )
    expect(screen.queryByRole('button', { name: /create|edit|delete|stocktake/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/total stock|reserved|units/i)).not.toBeInTheDocument()
    expect(warehousesService.show).not.toHaveBeenCalled()
    expect(inventoryService.list).not.toHaveBeenCalled()
  })

  it('mirrors cards during loading and supports an empty directory', async () => {
    let finish!: (value: ReturnType<typeof warehouseListPage>) => void
    vi.mocked(warehousesService.list).mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      })
    )
    const { container } = renderPage()
    expect(screen.getByTestId('query-loading-state')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('li')).toHaveLength(6)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(container.querySelectorAll('li .border-t')).toHaveLength(6)
    await act(async () => finish(warehouseListPage([])))
    expect(await screen.findByText('No warehouses yet')).toBeInTheDocument()
  })

  it('keeps existing paginated warehouse fetching with an accessible load-more action and retry', async () => {
    vi.mocked(warehousesService.list)
      .mockResolvedValueOnce(warehouseListPage([6], 1, 2))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(warehouseListPage([8], 2, 2))
    renderPage()
    const loadMore = await screen.findByRole('button', { name: 'Load more warehouses' })
    expect(warehousesService.list).toHaveBeenCalledTimes(1)
    fireEvent.click(loadMore)
    fireEvent.click(await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') }))
    await screen.findByRole('heading', { name: 'Warehouse 8' })
    expect(screen.getByRole('heading', { name: 'Warehouse 6' })).toBeInTheDocument()
    expect(warehousesService.list).toHaveBeenLastCalledWith(2, expect.any(AbortSignal), expect.any(Object))
    expect(screen.queryByRole('button', { name: 'Load more warehouses' })).not.toBeInTheDocument()
  })

  it('supports initial errors and background refresh errors, including empty cached results', async () => {
    vi.mocked(warehousesService.list)
      .mockRejectedValueOnce(new Error('private'))
      .mockResolvedValue(warehouseListPage([]))
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') }))
    await screen.findByText('No warehouses yet')
    vi.mocked(warehousesService.list).mockRejectedValue(new Error('private'))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh warehouses' }))
    await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') })
    expect(screen.getByText('No warehouses yet')).toBeInTheDocument()
    expect(screen.queryByText('private')).not.toBeInTheDocument()
  })

  it('localizes Arabic directory actions and keeps long names readable', async () => {
    await i18n.changeLanguage('ar')
    const data = warehouseListPage()
    data.items[0].name = 'مستودع الرياض طويل الاسم Warehouse-' + 'LongName'.repeat(12)
    vi.mocked(warehousesService.list).mockResolvedValue(data)
    renderPage()
    await screen.findByRole('link', { name: `فتح مخزون ${data.items[0].name}` })
    expect(screen.getByRole('main')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('heading', { name: data.items[0].name })).toHaveClass('break-words')
    expect(screen.getByText(data.items[0].name).tagName).toBe('BDI')
    await waitFor(() => expect(warehousesService.list).toHaveBeenCalledTimes(1))
  })

  it('provides one keyboard link per card with no nested controls and preserves the exact destination', async () => {
    const user = userEvent.setup()
    renderPage()
    const first = await screen.findByRole('link', { name: 'Open inventory for Warehouse 6' })
    const second = screen.getByRole('link', { name: 'Open inventory for Warehouse 8' })
    expect(first).toHaveAccessibleDescription('Active')
    expect(second).toHaveAccessibleDescription('Inactive')
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(within(first).queryByRole('button')).not.toBeInTheDocument()
    expect(first.querySelector('a')).toBeNull()
    expect(first).toHaveClass('focus-visible:ring-2')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Refresh warehouses' })).toHaveFocus()
    await user.tab()
    expect(first).toHaveFocus()
    await user.tab()
    expect(second).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/warehouses/8/inventory')
  })

  it('keeps loaded cards and prevents duplicate load-more requests while the next page is pending', async () => {
    let finish!: (value: ReturnType<typeof warehouseListPage>) => void
    vi.mocked(warehousesService.list)
      .mockResolvedValueOnce(warehouseListPage([6], 1, 2))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          })
      )
    renderPage()
    const loadMore = await screen.findByRole('button', { name: 'Load more warehouses' })
    fireEvent.click(loadMore)
    const pending = await screen.findByRole('button', { name: i18n.t('warehouses.loadingMore') })
    expect(pending).toBeDisabled()
    fireEvent.click(pending)
    expect(screen.getByRole('link', { name: 'Open inventory for Warehouse 6' })).toBeInTheDocument()
    expect(warehousesService.list).toHaveBeenCalledTimes(2)
    await act(async () => finish(warehouseListPage([8], 2, 2)))
    expect(await screen.findByRole('link', { name: 'Open inventory for Warehouse 8' })).toBeInTheDocument()
  })

  it('labels directory refresh distinctly and retains cards through a failed pending refresh', async () => {
    let fail!: (error: Error) => void
    renderPage()
    await screen.findByRole('heading', { name: 'Warehouse 6' })
    vi.mocked(warehousesService.list).mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          fail = reject
        })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Refresh warehouses' }))
    const pending = await screen.findByRole('button', { name: 'Refreshing warehouses…' })
    expect(pending).toBeDisabled()
    fireEvent.click(pending)
    expect(warehousesService.list).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { name: 'Warehouse 6' })).toBeInTheDocument()
    await act(async () => fail(new Error('offline')))
    await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') })
    expect(screen.getByRole('button', { name: 'Refresh warehouses' })).toBeEnabled()
    expect(screen.getByRole('heading', { name: 'Warehouse 8' })).toBeInTheDocument()
  })
})
