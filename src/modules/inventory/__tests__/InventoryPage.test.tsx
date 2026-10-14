import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import InventoryPage from '@/modules/inventory/pages/InventoryPage'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { inventoryService } from '@/modules/inventory/api/inventory.service'
import { warehouseListPage } from './inventory.fixtures'

vi.mock('@/hooks/queries/useInfiniteScroll', () => ({ useInfiniteScroll: () => ({ current: null }) }))
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
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
    data.items[0].name = 'مستودع الرياض طويل الاسم'
    vi.mocked(warehousesService.list).mockResolvedValue(data)
    renderPage()
    await screen.findByRole('link', { name: 'فتح مخزون مستودع الرياض طويل الاسم' })
    expect(screen.getByRole('main')).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('heading', { name: data.items[0].name })).toHaveClass('break-words')
    await waitFor(() => expect(warehousesService.list).toHaveBeenCalledTimes(1))
  })
})
