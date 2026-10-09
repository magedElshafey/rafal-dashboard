import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import '@/config/i18'
import i18n from '@/config/i18'
import { customersService } from '@/modules/customers/api/customers.service'
import type { CustomerListItem } from '@/modules/customers/types/customer.types'
import CustomersPage from '@/modules/customers/pages/CustomersPage'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

const customer = (id: number, overrides: Partial<CustomerListItem> = {}): CustomerListItem => ({
  id,
  name: `Customer ${id}`,
  email: `customer${id}@example.com`,
  phone: null,
  firstName: null,
  lastName: null,
  status: 'active',
  isBlocked: false,
  blockedAt: null,
  blockedReason: null,
  ordersCount: id,
  lifetimeSpend: id * 10.5,
  createdAt: '2026-09-26T18:43:40+00:00',
  updatedAt: '2026-09-26T18:44:59+00:00',
  ...overrides,
})

function paginated(items: CustomerListItem[], page = 1): PaginatedData<CustomerListItem> {
  const pageSize = 15
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  return {
    items: pageItems,
    paginate: {
      current_page: page,
      total_pages: totalPages,
      per_page: pageSize,
      total: items.length,
      count: pageItems.length,
      next_page_url: page < totalPages ? String(page + 1) : null,
      prev_page_url: page > 1 ? String(page - 1) : null,
    },
    extra: null,
  }
}

function renderPage(initialEntry = '/dashboard/customers') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <QueryClientProvider client={client}>
        <CustomersPage />
      </QueryClientProvider>
    </MemoryRouter>
  )
}

async function openCustomerAction(user: ReturnType<typeof userEvent.setup>, name: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${name}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${name}` }))
}

describe('CustomersPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  it('shows a layout skeleton and then the localized empty state', async () => {
    let resolveList!: (value: PaginatedData<CustomerListItem>) => void
    vi.spyOn(customersService, 'list').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve
        })
    )
    renderPage()

    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    resolveList(paginated([]))
    expect(await screen.findByText('No customers yet')).toBeInTheDocument()
  })

  it('shows a safe retry state and does not expose the raw error', async () => {
    vi.spyOn(customersService, 'list')
      .mockRejectedValueOnce(new Error('unsafe database detail'))
      .mockResolvedValueOnce(paginated([]))
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe database detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No customers yet')).toBeInTheDocument()
  })

  it('renders one source into responsive rows/cards without unsupported search', async () => {
    vi.spyOn(customersService, 'list').mockResolvedValue(
      paginated([
        customer(1, { name: '', firstName: 'Maged', lastName: 'Elshafey' }),
        customer(2, { name: '', email: '', phone: null, isBlocked: true }),
      ])
    )
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findAllByText('Maged Elshafey')).toHaveLength(2)
    expect(screen.getAllByText('Customer #2')).toHaveLength(2)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Actions for Maged Elshafey' })[0])
    expect(await screen.findByRole('menuitem', { name: 'Block Maged Elshafey' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(screen.getAllByRole('button', { name: 'Actions for Customer #2' })[0])
    expect(await screen.findByRole('menuitem', { name: 'Unblock Customer #2' })).toBeInTheDocument()
  })

  it('keeps drafts unapplied, retains filters on next pages, restarts pagination, and resets', async () => {
    const customers = Array.from({ length: 16 }, (_, index) => customer(index + 1))
    const list = vi.spyOn(customersService, 'list').mockImplementation(async (page) => paginated(customers, page))
    const user = userEvent.setup()

    renderPage('/dashboard/customers?page=4&date_from=2026-10-01')

    expect(await screen.findAllByText('Customer 16')).toHaveLength(2)
    await waitFor(() => expect(list.mock.calls.some(([page]) => page === 2)).toBe(true))
    expect(
      list.mock.calls.filter(([page]) => page <= 2).every(([, , filters]) => filters?.dateFrom === '2026-10-01')
    ).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const dateFrom = screen.getByLabelText('Date from')
    const appliedRequestCount = list.mock.calls.length
    await user.clear(dateFrom)
    await user.type(dateFrom, '2026-10-02')
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(list.mock.calls.some(([page, , filters]) => filters?.dateFrom === '2026-10-02' && page === 1)).toBe(true)
    )
    await waitFor(() =>
      expect(list.mock.calls.some(([page, , filters]) => filters?.dateFrom === '2026-10-02' && page === 2)).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(list.mock.calls.some(([page, , filters]) => filters?.dateFrom === '' && page === 1)).toBe(true)
    )
  })

  it('surfaces an invalid date range only after Apply and does not replace the applied query', async () => {
    const list = vi.spyOn(customersService, 'list').mockResolvedValue(paginated([customer(1)]))
    const user = userEvent.setup()

    renderPage()

    await screen.findAllByText('Customer 1')
    const appliedRequestCount = list.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByLabelText('Date from'), '2026-10-10')
    await user.type(screen.getByLabelText('Date to'), '2026-10-09')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Date from')).toHaveAttribute('aria-invalid', 'false')
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)

    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The date-from value cannot be after the date-to value.')
    expect(screen.getByLabelText('Date from')).toHaveAttribute('aria-describedby', 'customers-date-range-error')
    expect(screen.getByLabelText('Date to')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)
  })

  it('does not execute the Customers request for an invalid applied deep-link range', async () => {
    const list = vi.spyOn(customersService, 'list')

    renderPage('/dashboard/customers?date_from=2026-10-10&date_to=2026-10-09')

    await waitFor(() => expect(list).not.toHaveBeenCalled())
  })

  it('requires confirmation and prevents duplicate block submissions', async () => {
    vi.spyOn(customersService, 'list').mockResolvedValue(paginated([customer(1)]))
    let resolveBlock!: () => void
    const block = vi.spyOn(customersService, 'block').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveBlock = resolve
        })
    )
    const user = userEvent.setup()
    renderPage()
    await openCustomerAction(user, 'Customer 1', 'Block')

    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Block' })
    expect(block).not.toHaveBeenCalled()
    await user.dblClick(confirm)
    await waitFor(() => expect(confirm).toBeDisabled())
    expect(block).toHaveBeenCalledTimes(1)
    expect(block).toHaveBeenCalledWith(1)
    resolveBlock()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('preserves the loaded Customer and confirmation after a safe mutation failure', async () => {
    vi.spyOn(customersService, 'list').mockResolvedValue(paginated([customer(1)]))
    vi.spyOn(customersService, 'block').mockRejectedValue(new Error('secret backend detail'))
    const user = userEvent.setup()
    renderPage()
    await openCustomerAction(user, 'Customer 1', 'Block')
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Block' }))

    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('Customer could not be blocked.'))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getAllByText('Customer 1').length).toBeGreaterThan(0)
    expect(screen.queryByText('secret backend detail')).not.toBeInTheDocument()
  })
})
