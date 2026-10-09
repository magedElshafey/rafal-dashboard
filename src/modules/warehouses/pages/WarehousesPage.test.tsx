import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { citiesService } from '@/modules/cities/api/cities.service'
import type { City } from '@/modules/cities/types/city.types'
import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import type {
  WarehouseCreatePayload,
  WarehouseDetail,
  WarehouseListItem,
  WarehouseUpdatePayload,
} from '@/modules/warehouses/types/warehouse.types'
import WarehousesPage from './WarehousesPage'

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

const listItem = (id: number, overrides: Partial<WarehouseListItem> = {}): WarehouseListItem => ({
  id,
  name: `Warehouse ${id}`,
  isActive: true,
  createdAt: '2026-09-22T17:19:08+00:00',
  updatedAt: '2026-09-22T17:19:08+00:00',
  ...overrides,
})

const detail = (id: number, cityIds: number[] = [1], overrides: Partial<WarehouseDetail> = {}): WarehouseDetail => ({
  ...listItem(id),
  cities: cityIds.map((cityId) => ({ id: cityId, name: { ar: `مدينة ${cityId}`, en: `City ${cityId}` } })),
  ...overrides,
})

const city = (id: number): City => ({
  id,
  region_id: 1,
  region: { id: 1, name: { ar: 'الرياض', en: 'Riyadh' } },
  name: { ar: `مدينة ${id}`, en: `City ${id}` },
  boundary: null,
  center: null,
  is_active: true,
  sort_order: id,
  created_at: '2026-09-22T17:19:08+00:00',
  updated_at: '2026-09-22T17:19:08+00:00',
})

let warehouseItems: WarehouseListItem[] = []
let warehouseDetails = new Map<number, WarehouseDetail>()
let cities: City[] = []

function paginated<T>(items: T[], page: number) {
  const perPage = 15
  const start = (page - 1) * perPage
  const pageItems = items.slice(start, start + perPage)
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  return {
    items: pageItems,
    paginate: {
      current_page: page,
      total_pages: totalPages,
      per_page: perPage,
      total: items.length,
      count: pageItems.length,
      next_page_url: page < totalPages ? String(page + 1) : null,
      prev_page_url: page > 1 ? String(page - 1) : null,
    },
    extra: null,
  }
}

function installServiceFixtures() {
  vi.spyOn(citiesService, 'list').mockImplementation(async (page) => paginated(cities, page))
  vi.spyOn(warehousesService, 'list').mockImplementation(async (page) => paginated(warehouseItems, page))
  vi.spyOn(warehousesService, 'show').mockImplementation(async (id) => {
    const warehouse = warehouseDetails.get(id)
    if (!warehouse) throw new Error('Warehouse not found')
    return { success: true, message: 'ok', data: warehouse }
  })
  vi.spyOn(warehousesService, 'create').mockImplementation(async (payload: WarehouseCreatePayload) => {
    const id = Math.max(0, ...warehouseItems.map((warehouse) => warehouse.id)) + 1
    const created = detail(id, payload.cityIds, { name: payload.name, isActive: payload.isActive })
    warehouseItems.unshift(created)
    warehouseDetails.set(id, created)
    return { success: true, message: 'created', data: created }
  })
  vi.spyOn(warehousesService, 'update').mockImplementation(async (id, payload: WarehouseUpdatePayload) => {
    const current = warehouseDetails.get(id)
    if (!current) throw new Error('Warehouse not found')
    const updated = detail(id, payload.cityIds ?? current.cities.map((city) => city.id), {
      name: payload.name ?? current.name,
      isActive: payload.isActive ?? current.isActive,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
    })
    warehouseDetails.set(id, updated)
    warehouseItems = warehouseItems.map((warehouse) =>
      warehouse.id === id ? { ...warehouse, name: updated.name, isActive: updated.isActive } : warehouse
    )
    return { success: true, message: 'updated', data: updated }
  })
  vi.spyOn(warehousesService, 'delete').mockImplementation(async (id) => {
    warehouseItems = warehouseItems.filter((warehouse) => warehouse.id !== id)
    warehouseDetails.delete(id)
    return { success: true, message: 'deleted' }
  })
}

function seedWarehouses(items: WarehouseDetail[]) {
  warehouseItems = items.map(({ cities: _cities, ...warehouse }) => warehouse)
  warehouseDetails = new Map(items.map((warehouse) => [warehouse.id, warehouse]))
}

function apiError(message: string, errors?: Record<string, string[]>) {
  return Object.assign(new Error(message), {
    isAxiosError: true,
    response: { status: 422, data: { message, ...(errors ? { errors } : {}) } },
  })
}

function renderPage(initialEntry = '/dashboard/warehouses') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <WarehousesPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

async function openAction(user: ReturnType<typeof userEvent.setup>, name: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${name}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${name}` }))
}

async function selectCity(user: ReturnType<typeof userEvent.setup>, name: string) {
  if (!screen.queryByRole('listbox')) await user.click(screen.getByRole('button', { name: 'Cities' }))
  await user.click(await screen.findByRole('option', { name }))
}

describe('WarehousesPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    cities = [city(1), city(2), city(3)]
    seedWarehouses([])
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders loading, infinite pagination, responsive data, and no unsupported search or coverage field', async () => {
    seedWarehouses(Array.from({ length: 16 }, (_, index) => detail(index + 1)))
    const list = vi.mocked(warehousesService.list)
    renderPage()

    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(await screen.findAllByText('Warehouse 16')).toHaveLength(2)
    expect(list).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/coverage/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
    expect(list.mock.calls.map(([page]) => page)).toEqual([1, 2])
    expect(list.mock.calls.every(([, , filters]) => filters?.cityId === null)).toBe(true)
  })

  it('keeps drafts unapplied, retains filters on next pages, restarts pagination, and resets', async () => {
    seedWarehouses(Array.from({ length: 16 }, (_, index) => detail(index + 1)))
    const list = vi.mocked(warehousesService.list)
    const user = userEvent.setup()

    renderPage('/dashboard/warehouses?page=4&city_id=2')

    expect(await screen.findAllByText('Warehouse 16')).toHaveLength(2)
    await waitFor(() => expect(list.mock.calls.some(([page]) => page === 2)).toBe(true))
    expect(list.mock.calls.filter(([page]) => page <= 2).every(([, , filters]) => filters?.cityId === 2)).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const citySelect = screen.getByRole('combobox', { name: 'City' })
    await waitFor(() => expect(citySelect).toHaveTextContent('City 2'))
    const appliedRequestCount = list.mock.calls.length
    await user.click(citySelect)
    await user.click(await screen.findByRole('option', { name: 'City 1' }))
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(list.mock.calls.some(([page, , filters]) => filters?.cityId === 1 && page === 1)).toBe(true)
    )
    await waitFor(() =>
      expect(list.mock.calls.some(([page, , filters]) => filters?.cityId === 1 && page === 2)).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(list.mock.calls.some(([page, , filters]) => filters?.cityId === null && page === 1)).toBe(true)
    )
  })

  it('surfaces an invalid created range only after Apply and does not replace the applied query', async () => {
    seedWarehouses([detail(1)])
    const list = vi.mocked(warehousesService.list)
    const user = userEvent.setup()

    renderPage()

    await screen.findAllByText('Warehouse 1')
    const appliedRequestCount = list.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByLabelText('Created from'), '2026-10-10')
    await user.type(screen.getByLabelText('Created to'), '2026-10-09')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Created from')).toHaveAttribute('aria-invalid', 'false')
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)

    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The created-from date cannot be after the created-to date.'
    )
    expect(screen.getByLabelText('Created from')).toHaveAttribute('aria-describedby', 'warehouses-created-range-error')
    expect(screen.getByLabelText('Created to')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)
  })

  it('does not execute the Warehouse request for an invalid applied deep-link range', async () => {
    const list = vi.mocked(warehousesService.list)

    renderPage('/dashboard/warehouses?created_from=2026-10-10&created_to=2026-10-09')

    await waitFor(() => expect(list).not.toHaveBeenCalled())
  })

  it('shows safe retry and empty states with a Create action', async () => {
    const list = vi.mocked(warehousesService.list)
    const implementation = list.getMockImplementation()
    list.mockRejectedValueOnce(new Error('unsafe detail')).mockImplementation(implementation!)
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No warehouses yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Create Warehouse' })).toHaveLength(2)
  })

  it('requires Cities on Create and submits the exact complete selection', async () => {
    const create = vi.mocked(warehousesService.create)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No warehouses yet')
    await user.click(screen.getAllByRole('button', { name: 'Create Warehouse' })[0])
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    expect(await screen.findByText('Warehouse name is required.')).toBeInTheDocument()
    expect(screen.getByText('Select at least one city.')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /^Warehouse Name/ }), ' Main ')
    await selectCity(user, 'City 1')
    await selectCity(user, 'City 2')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Main', cityIds: [1, 2], isActive: true }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('maps city_ids validation and preserves Create selections on assignment conflict', async () => {
    vi.mocked(warehousesService.create)
      .mockRejectedValueOnce(apiError('The city ids field is required.', { city_ids: ['Choose a City.'] }))
      .mockRejectedValueOnce(apiError('City IDs 1 are already assigned to a warehouse.'))
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No warehouses yet')
    await user.click(screen.getAllByRole('button', { name: 'Create Warehouse' })[0])
    await user.type(screen.getByRole('textbox', { name: /^Warehouse Name/ }), 'Main')
    await selectCity(user, 'City 1')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(await screen.findByText('Choose a City.')).toBeInTheDocument()

    await selectCity(user, 'City 1')
    await selectCity(user, 'City 1')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('City IDs 1 are already assigned to a warehouse.')
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cities' })).toHaveTextContent('City 1')
    expect(screen.getByRole('textbox', { name: /^Warehouse Name/ })).toHaveValue('Main')
  })

  it('uses Show-before-edit and sends only a dirty name', async () => {
    seedWarehouses([detail(1, [1, 2])])
    const show = vi.mocked(warehousesService.show)
    const update = vi.mocked(warehousesService.update)
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Warehouse 1', 'Edit')

    const name = await screen.findByRole('textbox', { name: /^Warehouse Name/ })
    expect(show).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(name).toHaveValue('Warehouse 1')
    expect(screen.getByRole('button', { name: 'Cities' })).toHaveTextContent('City 1')
    await user.clear(name)
    await user.type(name, 'Central')
    await user.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith(1, { name: 'Central' }))
  })

  it('sends the complete selected City replacement and preserves it on conflict', async () => {
    seedWarehouses([detail(1, [1, 2])])
    const update = vi.mocked(warehousesService.update)
    update.mockRejectedValueOnce(apiError('City IDs 3 are already assigned to a different warehouse.'))
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Warehouse 1', 'Edit')
    await screen.findByRole('textbox', { name: /^Warehouse Name/ })
    await user.click(screen.getByRole('button', { name: 'Cities' }))
    await user.click(screen.getByRole('option', { name: 'City 1' }))
    await user.click(screen.getByRole('option', { name: 'City 3' }))
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() => expect(update).toHaveBeenCalledWith(1, { cityIds: [2, 3] }))
    expect(toastMocks.error).toHaveBeenCalledWith('City IDs 3 are already assigned to a different warehouse.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cities' })).toHaveTextContent('City 3')
  })

  it('requires Delete confirmation, prevents duplicate success, and removes the row', async () => {
    seedWarehouses([detail(1)])
    const remove = vi.mocked(warehousesService.delete)
    let resolveDelete!: () => void
    remove.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = () => {
            warehouseItems = []
            warehouseDetails.clear()
            resolve({ success: true, message: 'deleted' })
          }
        })
    )
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Warehouse 1', 'Delete')
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Delete' })
    expect(remove).not.toHaveBeenCalled()
    await user.dblClick(confirm)
    await waitFor(() => expect(confirm).toBeDisabled())
    expect(remove).toHaveBeenCalledTimes(1)
    resolveDelete()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Warehouse 1')).not.toBeInTheDocument()
  })

  it('keeps the Warehouse and confirmation open on stock conflict', async () => {
    seedWarehouses([detail(1)])
    vi.mocked(warehousesService.delete).mockRejectedValueOnce(
      apiError('Cannot delete warehouse: it still has stock for one or more product variants. Clear its stock first.')
    )
    const user = userEvent.setup()
    renderPage()
    await openAction(user, 'Warehouse 1', 'Delete')
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith(
        'Cannot delete warehouse: it still has stock for one or more product variants. Clear its stock first.'
      )
    )
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getAllByText('Warehouse 1').length).toBeGreaterThan(0)
  })
})
