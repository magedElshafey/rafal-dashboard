import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import type { LocationMapEditorLabels } from '@/components/map/location-map.types'
import i18n from '@/config/i18'
import { citiesService } from '@/modules/cities/api/cities.service'
import type { City, CityPayload, CityUpdatePayload } from '@/modules/cities/types/city.types'
import { regionsService } from '@/modules/regions/api/regions.service'
import type { Region } from '@/modules/regions/types/region.types'
import type { Coordinate } from '@/types/geo.types'
import CitiesPage from './CitiesPage'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

type MockLocationMapProps = {
  boundary: Coordinate[]
  center: Coordinate | null
  onBoundaryChange: (boundary: Coordinate[]) => void
  onCenterChange: (center: Coordinate | null) => void
  labels: LocationMapEditorLabels
  boundaryError?: string
  centerError?: string
  disabled?: boolean
}

vi.mock('@/components/map', () => ({
  LocationMapEditor: ({
    boundary,
    center,
    onBoundaryChange,
    onCenterChange,
    labels,
    boundaryError,
    centerError,
    disabled,
  }: MockLocationMapProps) => (
    <div>
      <p>{center ? `${center.lat}, ${center.lng}` : labels.noCenterSelected}</p>
      <p>{boundary.length ? labels.boundaryDefined(boundary.length) : labels.noBoundaryDefined}</p>
      <button type="button" disabled={disabled} onClick={() => onCenterChange({ lat: 24.75, lng: 46.7 })}>
        Set Center
      </button>
      <button type="button" disabled={disabled || !center} onClick={() => onCenterChange(null)}>
        Clear Center
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          onBoundaryChange([
            { lat: 24.7, lng: 46.5 },
            { lat: 24.8, lng: 46.7 },
            { lat: 24.6, lng: 46.8 },
          ])
        }
      >
        Draw Boundary
      </button>
      <button type="button" disabled={disabled || boundary.length === 0} onClick={() => onBoundaryChange([])}>
        Clear Boundary
      </button>
      {centerError ? <p>{centerError}</p> : null}
      {boundaryError ? <p>{boundaryError}</p> : null}
    </div>
  ),
}))

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

const city = (id: number, overrides: Partial<City> = {}): City => ({
  id,
  region_id: 1,
  region: { id: 1, name: { ar: 'منطقة الرياض', en: 'Riyadh Region' } },
  name: { ar: `مدينة ${id}`, en: `City ${id}` },
  boundary: null,
  center: null,
  is_active: true,
  sort_order: id,
  created_at: '2026-09-17T18:09:23+00:00',
  updated_at: '2026-09-17T18:09:23+00:00',
  ...overrides,
})

let cities: City[] = []
let regions: Region[] = []

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
  vi.spyOn(citiesService, 'create').mockImplementation(async (payload: CityPayload) => {
    const region = regions.find((item) => item.id === payload.regionId)
    if (!region || payload.regionId === null || !payload.center) throw new Error('Invalid City fixture payload')
    const created = city(Math.max(0, ...cities.map((item) => item.id)) + 1, {
      region_id: payload.regionId,
      region: { id: region.id, name: region.name },
      name: payload.name,
      boundary: payload.boundary,
      center: payload.center,
      is_active: payload.isActive,
      sort_order: payload.sortOrder ?? 0,
    })
    cities.unshift(created)
    return { success: true, message: 'created', data: created }
  })
  vi.spyOn(citiesService, 'update').mockImplementation(async (id, payload: CityUpdatePayload) => {
    const index = cities.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('City not found')
    const current = cities[index]
    const region =
      payload.regionId === undefined ? current.region : regions.find((item) => item.id === payload.regionId)
    if (!region) throw new Error('Region not found')
    const updated: City = {
      ...current,
      region_id: payload.regionId ?? current.region_id,
      region: { id: region.id, name: region.name },
      name: {
        ar: payload.nameAr ?? current.name.ar,
        en: payload.nameEn ?? current.name.en,
      },
      is_active: payload.isActive ?? current.is_active,
      sort_order: payload.sortOrder ?? current.sort_order,
      center: payload.center ?? current.center,
      boundary: payload.boundary ?? current.boundary,
    }
    cities[index] = updated
    return { success: true, message: 'updated', data: updated }
  })
  vi.spyOn(citiesService, 'delete').mockImplementation(async (id) => {
    cities = cities.filter((item) => item.id !== id)
    return { success: true, message: 'deleted' }
  })
  vi.spyOn(regionsService, 'list').mockImplementation(async (page) => paginated(regions, page))
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <CitiesPage />
      </QueryClientProvider>
    ),
  }
}

async function openAction(user: ReturnType<typeof userEvent.setup>, name: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${name}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${name}` }))
}

describe('CitiesPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    cities = []
    regions = [
      {
        id: 1,
        name: { ar: 'منطقة الرياض', en: 'Riyadh Region' },
        code: 'RUH',
        is_active: true,
        sort_order: 1,
        cities_count: 0,
        created_at: '2026-09-17T18:09:21+00:00',
        updated_at: '2026-09-17T18:09:21+00:00',
      },
    ]
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders loading, pagination, localized data, logical boundary count, status, and supported actions', async () => {
    cities = [
      city(16),
      city(15, {
        name: { ar: 'مدينة بلا ترجمة', en: '' },
        region: { id: 13, name: { ar: 'الجزيرة المحايدة', en: '' } },
        region_id: 13,
        boundary: [
          { lat: 1, lng: 1 },
          { lat: 2, lng: 2 },
          { lat: 3, lng: 3 },
          { lat: 1, lng: 1 },
        ],
        sort_order: -1,
        is_active: false,
      }),
      ...Array.from({ length: 14 }, (_, index) => city(index + 1)),
    ]
    const list = vi.mocked(citiesService.list)
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(await screen.findAllByText('مدينة بلا ترجمة')).toHaveLength(2)
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(screen.getAllByText('الجزيرة المحايدة').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Boundary defined · 3 points').length).toBeGreaterThan(0)
    expect(screen.getAllByText('-1')).toHaveLength(2)
    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/filter/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Actions for/ }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /view/i })).not.toBeInTheDocument()
  })

  it('shows a safe retry and the shared empty state', async () => {
    cities = []
    vi.mocked(citiesService.list).mockRejectedValueOnce(new Error('unsafe server detail'))
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe server detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No cities yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Create City' }).length).toBeGreaterThan(0)
  })

  it('validates create, submits Region ID once, and fully resets Create Another', async () => {
    cities = []
    const create = vi.mocked(citiesService.create)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No cities yet')
    await user.click(screen.getAllByRole('button', { name: 'Create City' })[0])

    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(await screen.findByText('Region is required.')).toBeInTheDocument()
    expect(screen.getByText('Arabic name is required.')).toBeInTheDocument()
    expect(screen.getByText('English name is required.')).toBeInTheDocument()
    expect(screen.getByText('City center is required.')).toBeInTheDocument()
    expect(screen.getByText('City boundary is required.')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: /Region/ }))
    await user.click(await screen.findByRole('option', { name: 'Riyadh Region' }))
    await user.type(screen.getByRole('textbox', { name: /Arabic Name/ }), 'الدرعية')
    await user.type(screen.getByRole('textbox', { name: /English Name/ }), 'Diriyah')
    await user.click(screen.getByRole('button', { name: 'Set Center' }))
    await user.click(screen.getByRole('button', { name: 'Draw Boundary' }))
    await user.dblClick(screen.getByRole('button', { name: 'Create & Create Another' }))

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        regionId: 1,
        name: { ar: 'الدرعية', en: 'Diriyah' },
        sortOrder: null,
        isActive: true,
        boundary: [
          { lat: 24.7, lng: 46.5 },
          { lat: 24.8, lng: 46.7 },
          { lat: 24.6, lng: 46.8 },
        ],
        center: { lat: 24.75, lng: 46.7 },
      })
    )
    expect(create).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Arabic Name/ })).toHaveValue(''))
    expect(screen.getByRole('textbox', { name: /English Name/ })).toHaveValue('')
    expect(screen.getByRole('spinbutton', { name: /Sort Order/ })).toHaveValue(null)
    expect(screen.getByText('No boundary defined.')).toBeInTheDocument()
    expect(screen.getByText('No center selected.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Region/ })).toHaveTextContent('Select a Region')
  })

  it('submits entered geography without adding a frontend closing point', async () => {
    cities = []
    const create = vi.mocked(citiesService.create)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No cities yet')
    await user.click(screen.getAllByRole('button', { name: 'Create City' })[0])
    await user.click(screen.getByRole('combobox', { name: /Region/ }))
    await user.click(await screen.findByRole('option', { name: 'Riyadh Region' }))
    await user.type(screen.getByRole('textbox', { name: /Arabic Name/ }), 'الدرعية')
    await user.type(screen.getByRole('textbox', { name: /English Name/ }), 'Diriyah')
    await user.click(screen.getByRole('button', { name: 'Set Center' }))
    await user.click(screen.getByRole('button', { name: 'Draw Boundary' }))
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          regionId: 1,
          boundary: [
            { lat: 24.7, lng: 46.5 },
            { lat: 24.8, lng: 46.7 },
            { lat: 24.6, lng: 46.8 },
          ],
          center: { lat: 24.75, lng: 46.7 },
        })
      )
    )
    expect(create.mock.calls[0][0].boundary).toHaveLength(3)
    await waitFor(() => expect(toastMocks.success).toHaveBeenCalledWith('City created successfully.'))
  })

  it('hydrates row-backed Edit, enables all confirmed fields, and sends only the dirty English name', async () => {
    cities = [
      city(1, {
        name: { ar: 'الدرعية', en: 'Diriyah' },
        boundary: [
          { lat: 24.6, lng: 46.5 },
          { lat: 24.6, lng: 46.9 },
          { lat: 24.9, lng: 46.9 },
          { lat: 24.9, lng: 46.5 },
          { lat: 24.6, lng: 46.5 },
        ],
        center: { lat: 24.75, lng: 46.7 },
        sort_order: -1,
        is_active: false,
      }),
    ]
    const update = vi.mocked(citiesService.update)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Diriyah')

    await openAction(user, 'Diriyah', 'Edit')
    const editDialog = screen.getByRole('dialog')
    await waitFor(() => expect(screen.getByRole('combobox', { name: /Region/ })).toHaveTextContent('Riyadh Region'))
    const arabicName = screen.getByRole('textbox', { name: /Arabic Name/ })
    expect(arabicName).toHaveValue('الدرعية')
    expect(screen.getByRole('textbox', { name: /English Name/ })).toHaveValue('Diriyah')
    await waitFor(() => expect(screen.getByRole('spinbutton', { name: /Sort Order/ })).toHaveValue(-1))
    expect(screen.getByRole('checkbox', { name: /Active/ })).not.toBeChecked()
    expect(screen.getByText('24.75, 46.7')).toBeInTheDocument()
    expect(within(editDialog).getByText('Boundary defined · 4 points')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    expect(arabicName).toBeEnabled()
    expect(screen.getByRole('combobox', { name: /Region/ })).toBeEnabled()
    const englishName = screen.getByRole('textbox', { name: /English Name/ })
    expect(englishName).toBeEnabled()
    expect(screen.getByRole('spinbutton', { name: /Sort Order/ })).toBeEnabled()
    expect(screen.getByRole('checkbox', { name: /Active/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Set Center' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Draw Boundary' })).toBeEnabled()
    expect(screen.queryByText(/Only the Arabic name can currently be updated/)).not.toBeInTheDocument()

    await user.clear(englishName)
    await user.type(englishName, 'Diriyah New')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(1, { nameEn: 'Diriyah New' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('sends changed geography atomically and blocks cleared required geography', async () => {
    cities = [
      city(1, {
        boundary: [
          { lat: 24.6, lng: 46.5 },
          { lat: 24.6, lng: 46.9 },
          { lat: 24.9, lng: 46.9 },
          { lat: 24.6, lng: 46.5 },
        ],
        center: { lat: 24.7, lng: 46.7 },
      }),
    ]
    const update = vi.mocked(citiesService.update)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('City 1')
    await openAction(user, 'City 1', 'Edit')

    await user.click(screen.getByRole('button', { name: 'Clear Center' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled())
    await user.click(screen.getByRole('button', { name: 'Set Center' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenLastCalledWith(1, { center: { lat: 24.75, lng: 46.7 } }))

    await openAction(user, 'City 1', 'Edit')
    await user.click(screen.getByRole('button', { name: 'Clear Boundary' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled())
    await user.click(screen.getByRole('button', { name: 'Draw Boundary' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(1, {
        boundary: [
          { lat: 24.7, lng: 46.5 },
          { lat: 24.8, lng: 46.7 },
          { lat: 24.6, lng: 46.8 },
        ],
      })
    )
  })

  it('opens a legacy nullable-geometry row safely and requires both geography values before update', async () => {
    cities = [city(2)]
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('City 2')
    await openAction(user, 'City 2', 'Edit')

    const englishName = screen.getByRole('textbox', { name: /English Name/ })
    await user.type(englishName, ' updated')
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Set Center' }))
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Draw Boundary' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
  })

  it('keeps Edit usable and shows safe localized feedback when update fails', async () => {
    cities = [
      city(4, {
        name: { ar: 'الخبر', en: 'Khobar' },
        center: { lat: 26.2, lng: 50.2 },
        boundary: [
          { lat: 26.1, lng: 50.1 },
          { lat: 26.3, lng: 50.1 },
          { lat: 26.2, lng: 50.3 },
          { lat: 26.1, lng: 50.1 },
        ],
      }),
    ]
    vi.spyOn(citiesService, 'update').mockRejectedValueOnce(new Error('unsafe backend detail'))
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Khobar')

    await openAction(user, 'Khobar', 'Edit')
    const arabicName = screen.getByRole('textbox', { name: /Arabic Name/ })
    await user.clear(arabicName)
    await user.type(arabicName, 'الخبر الجديدة')
    await user.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('City could not be updated.'))
    expect(screen.queryByText('unsafe backend detail')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(arabicName).toBeEnabled()
  })

  it('cancels delete, protects duplicate confirmation, deletes the correct City, and removes it from the list', async () => {
    cities = [city(7)]
    const remove = vi.mocked(citiesService.delete)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('City 7')

    await openAction(user, 'City 7', 'Delete')
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Delete City')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(remove).not.toHaveBeenCalled()

    await openAction(user, 'City 7', 'Delete')
    await user.dblClick(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith(7))
    expect(remove).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('No cities yet')).toBeInTheDocument()
  })

  it('shows safe localized delete feedback without exposing raw server details', async () => {
    cities = [city(9)]
    vi.spyOn(citiesService, 'delete').mockRejectedValueOnce(new Error('SQL raw detail'))
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('City 9')
    await openAction(user, 'City 9', 'Delete')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('City could not be deleted.'))
    expect(screen.queryByText('SQL raw detail')).not.toBeInTheDocument()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
