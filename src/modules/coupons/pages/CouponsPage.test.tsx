import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { couponsService } from '@/modules/coupons/api/coupons.service'
import { couponsKeys } from '@/modules/coupons/queries/coupons.keys'
import type { Coupon, CouponUpdatePayload } from '@/modules/coupons/types/coupon.types'
import CouponsPage from '@/modules/coupons/pages/CouponsPage'

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

const coupon = (overrides: Partial<Coupon> = {}): Coupon => ({
  id: 1,
  code: 'WELCOME',
  name: { ar: 'ترحيب', en: 'Welcome' },
  description: { ar: null, en: 'First order' },
  type: 'percent',
  value: 10,
  maxDiscountAmount: 150,
  minOrderAmount: null,
  startsAt: null,
  endsAt: null,
  isPublic: true,
  isActive: true,
  usageLimitTotal: null,
  usageLimitPerCustomer: 1,
  newCustomersOnly: true,
  usagesCount: 0,
  createdAt: '2026-09-28T00:00:00Z',
  updatedAt: '2026-09-28T00:00:00Z',
  ...overrides,
})

const fullUpdatePayload = (overrides: Partial<CouponUpdatePayload> = {}): CouponUpdatePayload => ({
  code: 'WELCOME',
  name: { ar: 'ترحيب', en: 'Welcome' },
  description: { ar: null, en: 'First order' },
  type: 'percent',
  value: 10,
  maxDiscountAmount: 150,
  minOrderAmount: null,
  startsAt: null,
  endsAt: null,
  isPublic: true,
  isActive: true,
  usageLimitTotal: null,
  usageLimitPerCustomer: 1,
  newCustomersOnly: true,
  ...overrides,
})

let coupons: Coupon[] = []

function page(items: Coupon[], currentPage = 1, total = items.length) {
  const totalPages = Math.max(1, Math.ceil(total / 15))
  return {
    items,
    paginate: {
      current_page: currentPage,
      total_pages: totalPages,
      per_page: 15,
      total,
      count: items.length,
      next_page_url: currentPage < totalPages ? String(currentPage + 1) : null,
      prev_page_url: currentPage > 1 ? String(currentPage - 1) : null,
    },
    extra: null,
  }
}

function installServiceFixtures() {
  vi.spyOn(couponsService, 'list').mockImplementation(async (currentPage) => {
    const start = (currentPage - 1) * 15
    return page(coupons.slice(start, start + 15), currentPage, coupons.length)
  })
  vi.spyOn(couponsService, 'create').mockImplementation(async (payload) => {
    const created = coupon({ id: 2, ...payload, usagesCount: 0 })
    coupons = [created, ...coupons]
    return { success: true, message: 'created', data: created }
  })
  vi.spyOn(couponsService, 'update').mockImplementation(async (id, payload) => {
    const current = coupons.find((item) => item.id === id)
    if (!current) throw new Error('missing')
    const updated: Coupon = {
      ...current,
      ...payload,
      name: { ...current.name, ...payload.name },
      description: { ...current.description, ...payload.description },
    }
    coupons = coupons.map((item) => (item.id === id ? updated : item))
    return { success: true, message: 'updated', data: updated }
  })
  vi.spyOn(couponsService, 'delete').mockImplementation(async (id) => {
    coupons = coupons.filter((item) => item.id !== id)
    return { success: true, message: 'deleted' }
  })
}

function renderPage(initialEntry = '/dashboard/coupons') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <CouponsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return client
}

async function openAction(user: ReturnType<typeof userEvent.setup>, action: string) {
  await user.click((await screen.findAllByRole('button', { name: 'Actions for Welcome' }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} Welcome` }))
}

describe('CouponsPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    coupons = [coupon()]
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('renders the responsive real list with no unsupported search and the filter trigger', async () => {
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(await screen.findAllByText('Welcome')).toHaveLength(2)
    expect(screen.getAllByText('Percent').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Public').length).toBeGreaterThan(0)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
  })

  it('surfaces an invalid date range only after Apply and keeps the applied query', async () => {
    const list = vi.mocked(couponsService.list)
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Welcome')
    const appliedRequestCount = list.mock.calls.length

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByLabelText('Date from'), '2026-10-10')
    await user.type(screen.getByLabelText('Date to'), '2026-10-09')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Date from')).toHaveAttribute('aria-invalid', 'false')
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)

    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The date-from value cannot be after the date-to value.')
    expect(screen.getByLabelText('Date from')).toHaveAttribute('aria-describedby', 'coupons-date-range-error')
    expect(screen.getByLabelText('Date to')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)
  })

  it('does not request an invalid applied deep-link date range', async () => {
    const list = vi.mocked(couponsService.list)
    renderPage('/dashboard/coupons?date_from=2026-10-10&date_to=2026-10-09')
    await waitFor(() => expect(list).not.toHaveBeenCalled())
  })

  it('keeps drafts unapplied, retains filters on next pages, restarts pagination, and resets', async () => {
    coupons = Array.from({ length: 16 }, (_, index) =>
      coupon({
        id: index + 1,
        code: `CODE-${index + 1}`,
        name: { ar: `قسيمة ${index + 1}`, en: `Coupon ${index + 1}` },
      })
    )
    const list = vi.mocked(couponsService.list)
    const user = userEvent.setup()
    renderPage('/dashboard/coupons?page=4&type=percent&is_currently_valid=0')

    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([requestedPage, , filters]) =>
            requestedPage === 2 && filters?.type === 'percent' && filters.isCurrentlyValid === false
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const appliedRequestCount = list.mock.calls.length
    await user.type(screen.getByLabelText('Date from'), '2026-10-01')
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([requestedPage, , filters]) =>
            requestedPage === 1 &&
            filters?.type === 'percent' &&
            filters.isCurrentlyValid === false &&
            filters.dateFrom === '2026-10-01'
        )
      ).toBe(true)
    )
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([requestedPage, , filters]) =>
            requestedPage === 2 &&
            filters?.type === 'percent' &&
            filters.isCurrentlyValid === false &&
            filters.dateFrom === '2026-10-01'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([requestedPage, , filters]) =>
            requestedPage === 1 &&
            filters?.type === null &&
            filters.isCurrentlyValid === null &&
            filters.dateFrom === ''
        )
      ).toBe(true)
    )
  })

  it('shows a safe retryable initial error and the localized empty state', async () => {
    coupons = []
    const list = vi.mocked(couponsService.list)
    const implementation = list.getMockImplementation()
    list.mockRejectedValueOnce(new Error('unsafe database detail')).mockImplementation(implementation!)
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe database detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No coupons yet')).toBeInTheDocument()
  })

  it('uses an Index row snapshot for Edit and preserves dirty values through refetch and failure', async () => {
    const update = vi.spyOn(couponsService, 'update').mockRejectedValueOnce(new Error('raw backend detail'))
    const client = renderPage()
    const user = userEvent.setup()
    await screen.findAllByText('Welcome')
    await openAction(user, 'Edit')
    expect(couponsService).not.toHaveProperty('show')
    const code = screen.getByRole('textbox', { name: /^Code/ })
    expect(code).toHaveValue('WELCOME')
    await user.clear(code)
    await user.type(code, 'DIRTY')

    coupons = [coupon({ code: 'SERVER', name: { ar: 'خادم', en: 'Server Changed' } })]
    await client.invalidateQueries({ queryKey: couponsKeys.lists() })
    await screen.findAllByText('Server Changed')
    expect(code).toHaveValue('DIRTY')

    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(1, fullUpdatePayload({ code: 'DIRTY' })))
    expect(code).toHaveValue('DIRTY')
    expect(screen.getByText('All current coupon values will be sent when this coupon is updated.')).toBeInTheDocument()
    expect(screen.queryByText('raw backend detail')).not.toBeInTheDocument()
  })

  it('keeps a pristine Edit disabled and sends no request', async () => {
    const update = vi.mocked(couponsService.update)
    renderPage()
    const user = userEvent.setup()
    await screen.findAllByText('Welcome')
    await openAction(user, 'Edit')
    const submit = screen.getByRole('button', { name: 'Update' })
    expect(submit).toBeDisabled()
    await user.click(submit)
    expect(update).not.toHaveBeenCalled()
  })

  it('clears max discount and sends the full body when switching from percent to fixed', async () => {
    const update = vi.mocked(couponsService.update)
    renderPage()
    const user = userEvent.setup()
    await screen.findAllByText('Welcome')
    await openAction(user, 'Edit')
    expect(screen.getByRole('spinbutton', { name: 'Max Discount Amount' })).toHaveValue(150)
    await user.click(screen.getByRole('combobox', { name: 'Type' }))
    await user.click(await screen.findByRole('option', { name: 'Fixed' }))
    expect(screen.queryByRole('spinbutton', { name: 'Max Discount Amount' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(1, fullUpdatePayload({ type: 'fixed', maxDiscountAmount: null }))
    )
  })

  it('sends the full current body when switching from fixed to percent', async () => {
    coupons = [coupon({ type: 'fixed', value: 25, maxDiscountAmount: null })]
    const update = vi.mocked(couponsService.update)
    renderPage()
    const user = userEvent.setup()
    await screen.findAllByText('Welcome')
    await openAction(user, 'Edit')
    await user.click(screen.getByRole('combobox', { name: 'Type' }))
    await user.click(await screen.findByRole('option', { name: 'Percent' }))
    expect(screen.getByRole('spinbutton', { name: 'Max Discount Amount' })).toHaveValue(null)
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(1, fullUpdatePayload({ type: 'percent', value: 25, maxDiscountAmount: null }))
    )
  })

  it('requires confirmation, preserves a failed Delete, and prevents duplicate pending Deletes', async () => {
    const remove = vi.spyOn(couponsService, 'delete')
    const user = userEvent.setup()
    renderPage()
    await screen.findAllByText('Welcome')
    await openAction(user, 'Delete')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(remove).not.toHaveBeenCalled()

    remove.mockRejectedValueOnce(new Error('conflict'))
    await openAction(user, 'Delete')
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
    expect(screen.getAllByText('Welcome').length).toBeGreaterThan(0)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()

    let finishDelete: (value: { success: boolean; message: string }) => void = () => undefined
    remove.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishDelete = resolve
        })
    )
    await user.dblClick(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(2))
    finishDelete({ success: true, message: 'deleted' })
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })
})
