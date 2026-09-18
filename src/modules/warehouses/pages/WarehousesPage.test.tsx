import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { resetWarehousesMock, seedWarehousesMock } from '@/modules/warehouses/mocks/warehouses.mock'
import WarehousesPage from './WarehousesPage'
import type { Warehouse } from '@/modules/warehouses/types/warehouse.types'

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

const warehouse = (id: number): Warehouse => ({
  id,
  name: `Warehouse ${id}`,
  coverage_zone: ['جدة', 'Makkah', 'Jeddah', `Zone ${id}`],
  is_active: true,
  created_at: '2026-09-10T16:27:42+00:00',
  updated_at: '2026-09-10T16:27:42+00:00',
})

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <WarehousesPage />
    </QueryClientProvider>
  )
}

async function openAction(user: ReturnType<typeof userEvent.setup>, name: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${name}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${name}` }))
}

describe('WarehousesPage', () => {
  beforeEach(async () => {
    resetWarehousesMock()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders loading, infinite pagination, compact coverage, and no unsupported search', async () => {
    seedWarehousesMock(Array.from({ length: 16 }, (_, index) => warehouse(index + 1)))
    const list = vi.spyOn(warehousesService, 'list')
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(await screen.findAllByText('Warehouse 16')).toHaveLength(2)
    expect(list).toHaveBeenCalledTimes(2)
    expect(screen.getAllByText('+2').length).toBeGreaterThan(0)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('shows safe retry and empty states', async () => {
    seedWarehousesMock([])
    const original = warehousesService.list
    vi.spyOn(warehousesService, 'list').mockRejectedValueOnce(new Error('unsafe detail')).mockImplementation(original)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No warehouses yet')).toBeInTheDocument()
  })

  it('creates with tags, resets create-another, edits from detail, and deletes with confirmation', async () => {
    seedWarehousesMock([warehouse(1)])
    const show = vi.spyOn(warehousesService, 'show')
    const create = vi.spyOn(warehousesService, 'create')
    const update = vi.spyOn(warehousesService, 'update')
    const remove = vi.spyOn(warehousesService, 'delete')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Warehouse 1')

    await user.click(screen.getByRole('button', { name: 'Create Warehouse' }))
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(await screen.findByText('Warehouse name is required.')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /^Warehouse Name/ }), ' New Warehouse ')
    await user.type(
      screen.getByRole('textbox', { name: 'Add coverage zone…' }),
      '  Riyadh  {Enter}Riyadh{Enter}الرياض{Enter}'
    )
    await user.click(screen.getByRole('button', { name: 'Create & Create Another' }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({ name: 'New Warehouse', coverageZone: ['Riyadh', 'الرياض'], isActive: true })
    )
    await waitFor(() => expect(screen.getByRole('textbox', { name: /^Warehouse Name/ })).toHaveValue(''))
    expect(screen.queryByRole('button', { name: 'Remove Riyadh' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await openAction(user, 'Warehouse 1', 'Edit')
    expect(await screen.findByDisplayValue('Warehouse 1')).toBeInTheDocument()
    expect(show).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Remove جدة' }))
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalled())

    await openAction(user, 'Warehouse 1', 'Delete')
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Delete Warehouse')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith(1))
  })
})
