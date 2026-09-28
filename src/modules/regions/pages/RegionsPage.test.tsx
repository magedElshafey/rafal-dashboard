import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { regionsService } from '@/modules/regions/api/regions.service'
import type { Region, RegionPayload } from '@/modules/regions/types/region.types'
import RegionsPage from './RegionsPage'

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

const region = (id: number, overrides: Partial<Region> = {}): Region => ({
  id,
  name: { ar: `منطقة ${id}`, en: `Region ${id}` },
  code: `R${id}`,
  is_active: true,
  sort_order: id,
  cities_count: id,
  created_at: '2026-09-17T18:09:21+00:00',
  updated_at: '2026-09-17T18:09:21+00:00',
  ...overrides,
})

let regions: Region[] = []

function installServiceFixtures() {
  const perPage = 15
  vi.spyOn(regionsService, 'list').mockImplementation(async (page) => {
    const start = (page - 1) * perPage
    const items = regions.slice(start, start + perPage)
    const totalPages = Math.max(1, Math.ceil(regions.length / perPage))
    return {
      items,
      paginate: {
        current_page: page,
        total_pages: totalPages,
        per_page: perPage,
        total: regions.length,
        count: items.length,
        next_page_url: page < totalPages ? String(page + 1) : null,
        prev_page_url: page > 1 ? String(page - 1) : null,
      },
      extra: null,
    }
  })
  vi.spyOn(regionsService, 'create').mockImplementation(async (payload: RegionPayload) => {
    const id = Math.max(0, ...regions.map((item) => item.id)) + 1
    const created = region(id, {
      name: payload.name,
      code: payload.code ?? null,
      sort_order: payload.sortOrder ?? 0,
      is_active: payload.isActive,
      cities_count: 0,
    })
    regions.unshift(created)
    return { success: true, message: 'created', data: created }
  })
  vi.spyOn(regionsService, 'update').mockImplementation(async (id, payload) => {
    const index = regions.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Region not found')
    const updated = {
      ...regions[index],
      name: payload.name,
      code: payload.code ?? null,
      sort_order: payload.sortOrder ?? regions[index].sort_order,
      is_active: payload.isActive,
    }
    regions[index] = updated
    return { success: true, message: 'updated', data: updated }
  })
  vi.spyOn(regionsService, 'delete').mockImplementation(async (id) => {
    regions = regions.filter((item) => item.id !== id)
    return { success: true, message: 'deleted' }
  })
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <RegionsPage />
      </QueryClientProvider>
    ),
  }
}

async function openAction(user: ReturnType<typeof userEvent.setup>, name: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${name}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${name}` }))
}

describe('RegionsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    regions = []
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders loading, pagination, localized fields, status, fallback code, and no unsupported search', async () => {
    regions = [
      region(16, {
        name: { ar: 'منطقة بلا ترجمة', en: '' },
        code: null,
        is_active: false,
        cities_count: 4,
        sort_order: 42,
      }),
      ...Array.from({ length: 15 }, (_, index) => region(index + 1)),
    ]
    const list = vi.mocked(regionsService.list)
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(await screen.findAllByText('منطقة بلا ترجمة')).toHaveLength(2)
    expect(list).toHaveBeenCalledTimes(2)
    expect(screen.getAllByText('4 Cities').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.getAllByText('42')).toHaveLength(2)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('shows a safe retry and the shared empty state', async () => {
    regions = []
    vi.mocked(regionsService.list).mockRejectedValueOnce(new Error('unsafe server detail'))
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe server detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No regions yet')).toBeInTheDocument()
  })

  it('omits empty optional code and sort order from create', async () => {
    regions = []
    const create = vi.mocked(regionsService.create)
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No regions yet')
    await user.click(screen.getAllByRole('button', { name: 'Create Region' })[0])
    await user.type(screen.getByRole('textbox', { name: /Arabic Name/ }), 'منطقة')
    await user.type(screen.getByRole('textbox', { name: /English Name/ }), 'Region')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        name: { ar: 'منطقة', en: 'Region' },
        code: undefined,
        sortOrder: undefined,
        isActive: true,
      })
    )
  })

  it('validates and resets create-another, edits from the complete row, and deletes after confirmation', async () => {
    regions = [region(1)]
    const create = vi.mocked(regionsService.create)
    const update = vi.mocked(regionsService.update)
    const remove = vi.mocked(regionsService.delete)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Region 1')

    await user.click(screen.getByRole('button', { name: 'Create Region' }))
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(await screen.findByText('Arabic name is required.')).toBeInTheDocument()
    expect(screen.getByText('English name is required.')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Arabic Name/ }), ' منطقة جديدة ')
    await user.type(screen.getByRole('textbox', { name: /English Name/ }), ' New Region ')
    await user.type(screen.getByRole('textbox', { name: /^Code/ }), ' NEW ')
    await user.type(screen.getByRole('spinbutton', { name: /Sort Order/ }), '0')
    await user.dblClick(screen.getByRole('button', { name: 'Create & Create Another' }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        name: { ar: 'منطقة جديدة', en: 'New Region' },
        code: 'NEW',
        sortOrder: 0,
        isActive: true,
      })
    )
    expect(create).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Arabic Name/ })).toHaveValue(''))
    expect(screen.getByRole('textbox', { name: /English Name/ })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /^Code/ })).toHaveValue('')
    expect(screen.getByRole('spinbutton', { name: /Sort Order/ })).toHaveValue(null)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await openAction(user, 'Region 1', 'Edit')
    expect(screen.getByDisplayValue('Region 1')).toBeInTheDocument()
    const codeInput = screen.getByRole('textbox', { name: /^Code/ })
    const sortOrderInput = screen.getByRole('spinbutton', { name: /Sort Order/ })
    expect(codeInput).toHaveValue('R1')
    expect(sortOrderInput).toHaveValue(1)
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    await user.clear(codeInput)
    await user.type(codeInput, 'R1X')
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
    await user.clear(codeInput)
    await user.type(codeInput, 'R1')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled())
    await user.clear(sortOrderInput)
    await user.type(sortOrderInput, '7')
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
    await user.clear(codeInput)
    await user.type(codeInput, 'R1X')
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(1, expect.objectContaining({ code: 'R1X', sortOrder: 7 })))

    await screen.findAllByText('Region 1')
    await openAction(user, 'Region 1', 'Delete')
    expect(await screen.findByRole('alertdialog')).toHaveTextContent('Delete Region')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith(1))
  })
})
