import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { shippingMethodsService } from '@/modules/shipping-methods/api/shipping-methods.service'
import {
  resetShippingMethodsMock,
  seedShippingMethodsMock,
} from '@/modules/shipping-methods/mocks/shipping-methods.mock'
import type { RawShippingMethod } from '@/modules/shipping-methods/types/shipping-method.types'
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
  eta_label: { ar: `${id} أيام`, en: `${id} days` },
  price: `${id}.50`,
  is_pickup: false,
  is_active: true,
  sort_order: id,
  created_at: '2026-09-20T19:55:22+00:00',
  updated_at: '2026-09-20T19:55:22+00:00',
  ...overrides,
})

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <ShippingMethodsPage />
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
  await user.type(screen.getByRole('textbox', { name: /Arabic Delivery Estimate/ }), 'اليوم')
  await user.type(screen.getByRole('textbox', { name: /English Delivery Estimate/ }), 'Today')
}

describe('ShippingMethodsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    resetShippingMethodsMock()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders structural loading, infinite pagination, localized data, both responsive views, and no search/filter', async () => {
    seedShippingMethodsMock([
      rawMethod(16, {
        name: { ar: 'طريقة بلا ترجمة', en: '' },
        eta_label: { ar: 'غداً', en: '' },
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
    expect(screen.getAllByText('-2')).toHaveLength(2)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/filter/i)).not.toBeInTheDocument()
  })

  it('shows safe Retry and the established empty state', async () => {
    seedShippingMethodsMock([])
    const original = shippingMethodsService.list
    vi.spyOn(shippingMethodsService, 'list')
      .mockRejectedValueOnce(new Error('unsafe database message'))
      .mockImplementation(original)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe database message')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No shipping methods yet')).toBeInTheDocument()
  })

  it('creates paid shipping once and Create Another resets every field', async () => {
    seedShippingMethodsMock([])
    const create = vi.spyOn(shippingMethodsService, 'create')
    const user = userEvent.setup()
    renderPage()
    await screen.findByText('No shipping methods yet')
    await user.click(screen.getAllByRole('button', { name: 'Create Shipping Method' })[0])
    expect(screen.getByRole('button', { name: 'Create & Create Another' })).toBeDisabled()
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
        etaLabel: { ar: 'اليوم', en: 'Today' },
        price: 30.5,
        isPickup: false,
        isActive: true,
        sortOrder: -1,
      })
    )
    expect(create).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('textbox', { name: /^Code/ })).toHaveValue(''))
    expect(screen.getByRole('textbox', { name: /Arabic Name/ })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: /English Delivery Estimate/ })).toHaveValue('')
    expect(screen.getByRole('spinbutton', { name: /^Price/ })).toHaveValue(0)
    expect(screen.getByRole('switch', { name: 'Pickup from Branch' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Active' })).toBeChecked()
    expect(screen.getByRole('spinbutton', { name: /Sort Order/ })).toHaveValue(null)
  })

  it('creates Pickup with a visible disabled zero price', async () => {
    seedShippingMethodsMock([])
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
    seedShippingMethodsMock([rawMethod(1)])
    const update = vi.spyOn(shippingMethodsService, 'update')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Method 1')
    await openAction(user, 'Method 1', 'Edit')
    expect(screen.getByRole('textbox', { name: /^Code/ })).toHaveValue('method-1')
    expect(screen.getByRole('spinbutton', { name: /^Price/ })).toHaveValue(1.5)
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    const eta = screen.getByRole('textbox', { name: /English Delivery Estimate/ })
    await user.clear(eta)
    await user.type(eta, 'Tomorrow')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled())
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(1, { etaLabelEn: 'Tomorrow' }))
  })

  it('prevents Edit from clearing an existing Sort Order', async () => {
    seedShippingMethodsMock([rawMethod(1, { sort_order: 3 })])
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
    seedShippingMethodsMock([rawMethod(1, { sort_order: 3 })])
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
    seedShippingMethodsMock([
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
    seedShippingMethodsMock([rawMethod(7)])
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
