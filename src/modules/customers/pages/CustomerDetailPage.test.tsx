import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import '@/config/i18'
import i18n from '@/config/i18'
import { customersService } from '@/modules/customers/api/customers.service'
import CustomerDetailPage from '@/modules/customers/pages/CustomerDetailPage'
import type { CustomerDetail, CustomerOrderListItem } from '@/modules/customers/types/customer.types'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const detail = (overrides: Partial<CustomerDetail> = {}): CustomerDetail => ({
  id: 6,
  name: '',
  email: 'customer@example.com',
  phone: null,
  firstName: 'Maged',
  lastName: 'Elshafey',
  termsAcceptedAt: '2026-09-26T18:44:59+00:00',
  marketingOptIn: false,
  status: 'active',
  isBlocked: false,
  blockedAt: null,
  blockedReason: null,
  addressesCount: 0,
  createdAt: '2026-09-26T18:43:40+00:00',
  updatedAt: '2026-09-26T18:44:59+00:00',
  ...overrides,
})

const order: CustomerOrderListItem = {
  id: 64,
  orderNumber: 'RF-10064',
  displayNumber: '#RF-10064',
  status: 'processing',
  itemsCount: 0,
  total: 277.5,
  currency: 'SAR',
  paymentStatus: 'paid',
  isGift: true,
  placedAt: null,
}

function paginated(items: CustomerOrderListItem[]): PaginatedData<CustomerOrderListItem> {
  return {
    items,
    paginate: {
      current_page: 1,
      total_pages: 1,
      per_page: 15,
      total: items.length,
      count: items.length,
      next_page_url: null,
      prev_page_url: null,
    },
    extra: null,
  }
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <MemoryRouter initialEntries={['/dashboard/customers/6']}>
      <QueryClientProvider client={client}>
        <Routes>
          <Route path="/dashboard/customers/:id" element={<CustomerDetailPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

describe('CustomerDetailPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await i18n.changeLanguage('en')
  })

  it('starts authoritative Show and paginated Orders independently from the route ID', async () => {
    let resolveShow!: (value: CustomerDetail) => void
    const show = vi.spyOn(customersService, 'show').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveShow = resolve
        })
    )
    const orders = vi.spyOn(customersService, 'orders').mockResolvedValue(paginated([order]))
    renderPage()

    await waitFor(() => expect(show).toHaveBeenCalledWith(6, expect.any(AbortSignal)))
    expect(orders).toHaveBeenCalledWith(6, 1, expect.any(AbortSignal))
    resolveShow(detail())
    expect(await screen.findByRole('heading', { name: 'Maged Elshafey' })).toBeInTheDocument()
    expect(await screen.findAllByText('#RF-10064')).toHaveLength(2)
    expect(screen.getAllByText(/277\.50/).length).toBeGreaterThan(0)
  })

  it('keeps Customer details usable when the independent Orders query fails', async () => {
    vi.spyOn(customersService, 'show').mockResolvedValue(detail())
    vi.spyOn(customersService, 'orders').mockRejectedValue(new Error('unsafe order failure'))
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Maged Elshafey' })).toBeInTheDocument()
    expect(await screen.findByText('Identity')).toBeInTheDocument()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe order failure')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Block' })).toBeInTheDocument()
  })

  it.each([
    [false, 'Block'],
    [true, 'Unblock'],
  ])('shows no-orders state and derives the access action from isBlocked=%s', async (isBlocked, actionLabel) => {
    vi.spyOn(customersService, 'show').mockResolvedValue(detail({ isBlocked }))
    vi.spyOn(customersService, 'orders').mockResolvedValue(paginated([]))
    renderPage()

    expect(await screen.findByText('No orders yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: actionLabel })).toBeInTheDocument()
  })
})
