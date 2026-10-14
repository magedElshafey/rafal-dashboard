import { normalizeInventoryFilters } from '../utils/inventory-filters'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { matchRoutes, MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'
import { WarehouseActions } from '@/modules/warehouses/components/WarehouseActions'
import WarehouseInventoryPage from '@/modules/warehouses/pages/WarehouseInventoryPage'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { inventoryService } from '@/modules/inventory/api/inventory.service'
import { dashboardNavigation } from '@/modules/dashboard/layout/dashboard-navigation'
import { PrivateRoutes } from '@/routes/privateRoutes'
import { Routes as AppRoutes } from '@/routes/routes'
import en from '@/modules/inventory/locale/en.json'
import ar from '@/modules/inventory/locale/ar.json'
import { inventoryPage } from './inventory.fixtures'

const warehouse = { id: 6, name: 'Warehouse 6', isActive: true, createdAt: '', updatedAt: '', cities: [] }

function renderWarehouse(entry = '/dashboard/warehouses/6/inventory') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="/dashboard/warehouses"
            element={<WarehouseActions warehouse={warehouse} onEdit={vi.fn()} onDelete={vi.fn()} />}
          />
          <Route path="/dashboard/warehouses/:id/inventory" element={<WarehouseInventoryPage />} />
          <Route path="/dashboard/inventory" element={<p>All inventory destination</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('inventory navigation and capability boundary', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await i18n.changeLanguage('en')
    vi.spyOn(warehousesService, 'show').mockResolvedValue({ success: true, message: 'ok', data: warehouse })
    vi.spyOn(inventoryService, 'list').mockResolvedValue(inventoryPage())
    Element.prototype.scrollIntoView = vi.fn()
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
    HTMLElement.prototype.setPointerCapture = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()
  })

  it('registers both lazy authenticated destinations and central navigation', () => {
    expect(matchRoutes(PrivateRoutes, AppRoutes.inventory)?.at(-1)?.route.Component).toBeDefined()
    expect(matchRoutes(PrivateRoutes, AppRoutes.warehouseInventoryPath(6))?.at(-1)?.params.id).toBe('6')
    expect(dashboardNavigation.find((item) => item.to === AppRoutes.inventory)?.labelKey).toBe('inventory.title')
  })

  it('navigates from the warehouse menu to its scoped workspace and preserves warehouse management', async () => {
    const user = userEvent.setup()
    renderWarehouse('/dashboard/warehouses')
    await user.click(screen.getByRole('button', { name: 'Actions for Warehouse 6' }))
    expect(await screen.findByRole('menuitem', { name: 'Edit Warehouse 6' })).toBeEnabled()
    await user.click(await screen.findByRole('menuitem', { name: 'Open inventory for Warehouse 6' }))
    await screen.findByRole('heading', { name: 'Warehouse 6' })
    await screen.findByRole('article')
    expect(screen.getByRole('link', { name: 'Manage warehouses' })).toHaveAttribute('href', '/dashboard/warehouses')
    expect(inventoryService.list).toHaveBeenCalledWith(6, 1, expect.any(AbortSignal), normalizeInventoryFilters())
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('link', { name: 'Back to inventory warehouses' }))
    await screen.findByText('All inventory destination')
  })

  it('supports refreshable identity, loading, error and retry', async () => {
    vi.mocked(warehousesService.show).mockRejectedValueOnce(new Error('private'))
    renderWarehouse()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: i18n.t('queryState.actions.retry') }))
    await screen.findByRole('heading', { name: 'Warehouse 6' })
    expect(warehousesService.show).toHaveBeenCalledWith(6, expect.any(AbortSignal))
  })

  it('does not fetch an invalid warehouse identity', async () => {
    renderWarehouse('/dashboard/warehouses/invalid/inventory')
    expect(screen.getByText('Warehouse not found')).toBeInTheDocument()
    await waitFor(() => expect(warehousesService.show).not.toHaveBeenCalled())
  })

  it('renders not-found separately from inventory-empty', async () => {
    vi.mocked(warehousesService.show).mockRejectedValue({ isAxiosError: true, response: { status: 404 } })
    renderWarehouse()
    await screen.findByText('Warehouse not found')
    expect(screen.queryByText('No stock records')).not.toBeInTheDocument()
  })

  it('has matching English/Arabic concepts allowing locale-specific plural categories and no reservation claims', () => {
    const keys = (value: object, prefix = ''): string[] =>
      Object.entries(value).flatMap(([key, item]) =>
        typeof item === 'object' ? keys(item, `${prefix}${key}.`) : [`${prefix}${key}`]
      )
    const concepts = (value: object) =>
      [...new Set(keys(value).map((key) => key.replace(/_(zero|one|two|few|many|other)$/, '')))].sort()
    expect(concepts(ar)).toEqual(concepts(en))
    expect(keys(en).some((key) => /reserved|counted|reconcile/.test(key))).toBe(false)
  })
})
