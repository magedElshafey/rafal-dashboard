import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { shippingMethodsService } from '@/modules/shipping-methods/api/shipping-methods.service'
import type {
  RawShippingMethod,
  ShippingMethod,
  ShippingMethodCreatePayload,
  ShippingMethodUpdatePayload,
} from '@/modules/shipping-methods/types/shipping-method.types'
import ShippingMethodsPage from './ShippingMethodsPage'

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

const rawMethod = (id: number, overrides: Partial<RawShippingMethod> = {}): RawShippingMethod => ({
  id,
  code: `method-${id}`,
  name: { ar: `طريقة ${id}`, en: `Method ${id}` },
  eta_label: { ar: `${id}-${id + 2} أيام عمل`, en: `${id}-${id + 2} business days` },
  price: `${id}.50`,
  is_pickup: false,
  is_active: true,
  sort_order: id,
  created_at: '2026-09-20T19:55:22+00:00',
  updated_at: '2026-09-20T19:55:22+00:00',
  ...overrides,
})

let shippingMethods: ShippingMethod[] = []

function toShippingMethod(raw: RawShippingMethod): ShippingMethod {
  return {
    id: raw.id,
    code: raw.code,
    name: { ...raw.name },
    etaLabel: { ...raw.eta_label },
    price: Number(raw.price),
    isPickup: raw.is_pickup,
    isActive: raw.is_active,
    sortOrder: raw.sort_order,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function seedShippingMethods(methods: RawShippingMethod[]) {
  shippingMethods = methods.map(toShippingMethod)
}

function paginated(items: ShippingMethod[], page: number) {
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
  vi.spyOn(shippingMethodsService, 'list').mockImplementation(async (page) => paginated(shippingMethods, page))
  vi.spyOn(shippingMethodsService, 'create').mockImplementation(async (payload: ShippingMethodCreatePayload) => {
    const now = '2026-09-28T00:00:00Z'
    const created: ShippingMethod = {
      id: Math.max(0, ...shippingMethods.map((method) => method.id)) + 1,
      code: payload.code,
      name: { ...payload.name },
      etaLabel: { ...payload.etaLabel },
      price: payload.price,
      isPickup: payload.isPickup,
      isActive: payload.isActive,
      sortOrder: payload.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    }
    shippingMethods.unshift(created)
    return { success: true, message: 'created', data: created }
  })
  vi.spyOn(shippingMethodsService, 'update').mockImplementation(async (id, payload: ShippingMethodUpdatePayload) => {
    const index = shippingMethods.findIndex((method) => method.id === id)
    if (index < 0) throw new Error('Shipping method not found')
    const current = shippingMethods[index]
    const updated: ShippingMethod = {
      ...current,
      code: payload.code ?? current.code,
      name: {
        ar: payload.nameAr ?? current.name.ar,
        en: payload.nameEn ?? current.name.en,
      },
      etaLabel: {
        ar: payload.etaLabelAr ?? current.etaLabel.ar,
        en: payload.etaLabelEn ?? current.etaLabel.en,
      },
      price: payload.price ?? current.price,
      isPickup: payload.isPickup ?? current.isPickup,
      isActive: payload.isActive ?? current.isActive,
      sortOrder: payload.sortOrder ?? current.sortOrder,
    }
    shippingMethods[index] = updated
    return { success: true, message: 'updated', data: updated }
  })
  vi.spyOn(shippingMethodsService, 'delete').mockImplementation(async (id) => {
    shippingMethods = shippingMethods.filter((method) => method.id !== id)
    return { success: true, message: 'deleted' }
  })
}

function renderPage(initialEntry = '/dashboard/shipping-methods') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ShippingMethodsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

async function openAction(user: ReturnType<typeof userEvent.setup>, name: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${name}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${name}` }))
}

async function fillRequiredCreateFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: /^Code/ }), 'same-day')
  await user.type(screen.getByRole('textbox', { name: /Arabic Name/ }), 'نفس اليوم')
  await user.type(screen.getByRole('textbox', { name: /English Name/ }), 'Same Day')
  await user.type(screen.getByRole('textbox', { name: /Arabic ETA label/ }), '٣-٥ أيام عمل')
  await user.type(screen.getByRole('textbox', { name: /English ETA label/ }), '3-5 business days')
}

describe('ShippingMethodsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    shippingMethods = []
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders structural loading, infinite pagination, localized data, both responsive views, and no search', async () => {
    seedShippingMethods([
      rawMethod(16, {
        name: { ar: 'طريقة بلا ترجمة', en: '' },
        eta_label: { ar: 'يومان', en: 'Two business days' },
        price: '0.00',
        is_pickup: true,
        is_active: false,
        sort_order: -2,
      }),
      ...Array.from({ length: 15 }, (_, index) => rawMethod(index + 1)),
    ])
    const list = vi.spyOn(shippingMethodsService, 'list')
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(await screen.findAllByText('طريقة بلا ترجمة')).toHaveLength(2)
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2))
    expect(screen.getAllByText('Pickup').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Inactive').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Two business days')).toHaveLength(2)
    expect(screen.getAllByText('-2')).toHaveLength(2)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
  })

  it('keeps drafts unapplied, retains sorting on next pages, restarts pagination, and resets', async () => {
    seedShippingMethods(Array.from({ length: 16 }, (_, index) => rawMethod(index + 1)))
    const list = vi.mocked(shippingMethodsService.list)
    const user = userEvent.setup()
    renderPage('/dashboard/shipping-methods?page=4&sort_by=code&sort_dir=asc')

    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([page, , filters]) => page === 2 && filters?.sortBy === 'code' && filters.sortDir === 'asc'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const appliedRequestCount = list.mock.calls.length
    await user.click(screen.getByRole('combobox', { name: 'Sort direction' }))
    await user.click(await screen.findByRole('option', { name: 'Descending' }))
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([page, , filters]) => page === 1 && filters?.sortBy === 'code' && filters.sortDir === 'desc'
        )
      ).toBe(true)
    )
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([page, , filters]) => page === 2 && filters?.sortBy === 'code' && filters.sortDir === 'desc'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(
        list.mock.calls.some(([page, , filters]) => page === 1 && filters?.sortBy === null && filters.sortDir === null)
      ).toBe(true)
    )
  })

  it('shows safe Retry and the established empty state', async () => {
    seedShippingMethods([])
    const list = vi.mocked(shippingMethodsService.list)
    const implementation = list.getMockImplementation()
    list.mockRejectedValueOnce(new Error('unsafe database message')).mockImplementation(implementation!)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe database message')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No shipping methods yet')).toBeInTheDocument()
  })

  it('creates paid shipping once and Create Another resets every field', async () => {
    seedShippingMethods([])
    const create = vi.spyOn(shippingMethodsService, 'create')
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No shipping methods yet')
    await user.click(screen.getAllByRole('button', { name: 'Create Shipping Method' })[0])
    expect(screen.getByRole('button', { name: 'Create & Create Another' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: /Arabic ETA label/ })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /English ETA label/ })).toBeInTheDocument()
    await fillRequiredCreateFields(user)
    const price = screen.getByRole('spinbutton', { name: /^Price/ })
    await user.clear(price)
    await user.type(price, '30.5')
    await user.type(screen.getByRole('spinbutton', { name: /Sort Order/ }), '-1')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Create & Create Another' })).toBeEnabled())
    await user.dblClick(screen.getByRole('button', { name: 'Create & Create Another' }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        code: 'same-day',
        name: { ar: 'نفس اليوم', en: 'Same Day' },
        etaLabel: { ar: '٣-٥ أيام عمل', en: '3-5 business days' },
        price: 30.5,
        isPickup: false,
        isActive: true,
        sortOrder: -1,
      })
    )
    expect(create).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('textbox', { name: /^Code/ })).toHaveValue(''))
    expect(screen.getByRole('textbox', { name: /Arabic Name/ })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /Arabic ETA label/ })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /English ETA label/ })).toHaveValue('')
    expect(screen.getByRole('spinbutton', { name: /^Price/ })).toHaveValue(0)
    expect(screen.getByRole('switch', { name: 'Pickup from Branch' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: /Sort Order/ })).toHaveValue(null)
  })

  it('uses localized ETA text fields in Arabic', async () => {
    seedShippingMethods([])
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('لا توجد طرق شحن بعد')
    await user.click(screen.getAllByRole('button', { name: 'إنشاء طريقة شحن' })[0])

    const etaFields = screen.getAllByRole('textbox', { name: /وصف مدة التوصيل/ })
    expect(etaFields).toHaveLength(2)
    expect(etaFields[0]).toHaveAttribute('dir', 'rtl')
    expect(etaFields[1]).toHaveAttribute('dir', 'ltr')
  })

  it('creates Pickup with a visible disabled zero price', async () => {
    seedShippingMethods([])
    const create = vi.spyOn(shippingMethodsService, 'create')
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No shipping methods yet')
    await user.click(screen.getAllByRole('button', { name: 'Create Shipping Method' })[0])
    await fillRequiredCreateFields(user)
    const price = screen.getByRole('spinbutton', { name: /^Price/ })
    await user.clear(price)
    await user.type(price, '25')
    await user.click(screen.getByRole('switch', { name: 'Pickup from Branch' }))
    expect(price).toHaveValue(0)
    expect(price).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('button', { name: /^Create$/ })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ isPickup: true, price: 0, sortOrder: null }))
    )
  })

  it('hydrates row-backed Edit and submits only one dirty nested field', async () => {
    seedShippingMethods([rawMethod(1)])
    const update = vi.spyOn(shippingMethodsService, 'update')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Method 1')
    await openAction(user, 'Method 1', 'Edit')
    expect(screen.getByRole('textbox', { name: /^Code/ })).toHaveValue('method-1')
    expect(screen.getByRole('spinbutton', { name: /^Price/ })).toHaveValue(1.5)
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    const eta = screen.getByRole('textbox', { name: /English ETA label/ })
    expect(eta).toHaveValue('1-3 business days')
    await user.clear(eta)
    await user.type(eta, '2-4 business days')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(1, { etaLabelEn: '2-4 business days' }))
  })

  it('prevents Edit from clearing an existing Sort Order', async () => {
    seedShippingMethods([rawMethod(1, { sort_order: 3 })])
    const update = vi.spyOn(shippingMethodsService, 'update')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Method 1')
    await openAction(user, 'Method 1', 'Edit')
    const sortOrder = screen.getByRole('spinbutton', { name: /Sort Order/ })
    expect(sortOrder).toHaveValue(3)
    await user.clear(sortOrder)
    expect(await screen.findByText('This field is required.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    expect(update).not.toHaveBeenCalled()
  })

  it.each([0, -2])('submits a valid dirty Edit Sort Order of %s', async (nextSortOrder) => {
    seedShippingMethods([rawMethod(1, { sort_order: 3 })])
    const update = vi.spyOn(shippingMethodsService, 'update')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Method 1')
    await openAction(user, 'Method 1', 'Edit')
    const sortOrder = screen.getByRole('spinbutton', { name: /Sort Order/ })
    await user.clear(sortOrder)
    await user.type(sortOrder, String(nextSortOrder))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(1, { sortOrder: nextSortOrder }))
  })

  it('keeps zero when Pickup is turned off and enforces both dirty fields when turned on', async () => {
    seedShippingMethods([
      rawMethod(1, { price: '0', is_pickup: true }),
      rawMethod(2, { price: '25', is_pickup: false }),
    ])
    const update = vi.spyOn(shippingMethodsService, 'update')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Method 1')
    await openAction(user, 'Method 1', 'Edit')
    const pickup = screen.getByRole('switch', { name: 'Pickup from Branch' })
    const price = screen.getByRole('spinbutton', { name: /^Price/ })
    expect(price).toBeDisabled()
    await user.click(pickup)
    expect(price).toHaveValue(0)
    expect(price).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await openAction(user, 'Method 2', 'Edit')
    await user.click(screen.getByRole('switch', { name: 'Pickup from Branch' }))
    expect(screen.getByRole('spinbutton', { name: /^Price/ })).toHaveValue(0)
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(2, { isPickup: true, price: 0 }))
  })

  it('preserves edits on safe update failure and confirms exact Delete behavior', async () => {
    seedShippingMethods([rawMethod(7)])
    vi.spyOn(shippingMethodsService, 'update').mockRejectedValueOnce(new Error('raw SQL detail'))
    const remove = vi.spyOn(shippingMethodsService, 'delete')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Method 7')
    await openAction(user, 'Method 7', 'Edit')
    const code = screen.getByRole('textbox', { name: /^Code/ })
    await user.clear(code)
    await user.type(code, 'changed')
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('Shipping method could not be updated.'))
    expect(code).toHaveValue('changed')
    expect(screen.queryByText('raw SQL detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    await openAction(user, 'Method 7', 'Delete')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(remove).not.toHaveBeenCalled()
    await openAction(user, 'Method 7', 'Delete')
    await user.dblClick(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith(7))
    expect(remove).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('No shipping methods yet')).toBeInTheDocument()
  })
})
