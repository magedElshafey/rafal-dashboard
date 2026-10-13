import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { customersService } from '@/modules/customers/api/customers.service'
import { normalizeStoreRating, storeRatingsService } from '../api/store-ratings.service'
import { storeRatingsKeys } from '../queries/store-ratings.keys'
import { paginated, rawStoreRating } from '../test/store-rating.fixtures'
import { emptyStoreRatingsFilters } from '../utils/store-rating-filters'
import type { StoreRating } from '../types/store-rating.types'
import en from '../locale/en.json'
import ar from '../locale/ar.json'
import StoreRatingsPage from './StoreRatingsPage'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))
const item = normalizeStoreRating(rawStoreRating)

function renderPage(route = '/dashboard/store-ratings') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>
          <StoreRatingsPage />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  }
}
async function openModeration(user: ReturnType<typeof userEvent.setup>, action: 'approve' | 'reject') {
  const context = { name: 'abdullah essam', order: 'RF-10047', id: 2 }
  await user.click(
    (await screen.findAllByRole('button', { name: i18n.t('storeRatings.actions.forRating', context) }))[0]
  )
  await user.click(
    await screen.findByRole('menuitem', { name: i18n.t(`storeRatings.actions.${action}Named`, context) })
  )
  return screen.findByRole('alertdialog')
}

describe('Store Ratings page', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(storeRatingsService, 'list').mockResolvedValue(paginated([item]))
    vi.spyOn(customersService, 'list').mockResolvedValue(paginated([]))
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
    HTMLElement.prototype.scrollIntoView = vi.fn()
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
    HTMLElement.prototype.setPointerCapture = vi.fn()
    HTMLElement.prototype.releasePointerCapture = vi.fn()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('renders the confirmed response, accessible rating, order link and read-only admin response in both layouts', async () => {
    vi.mocked(storeRatingsService.list).mockResolvedValue(
      paginated([item, { ...item, id: 3, status: 'approved', adminResponse: 'Thank you' }])
    )
    renderPage()
    const table = await screen.findByRole('table', { name: 'Store rating moderation' })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(8)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(within(table).getAllByText('abdullah essam')).toHaveLength(2)
    expect(within(table).getAllByText('5 / 5')).toHaveLength(2)
    expect(screen.getAllByText('جميل جدا')).toHaveLength(4)
    expect(screen.getAllByText('Thank you')).toHaveLength(2)
    expect(
      screen
        .getAllByRole('link', { name: 'RF-10047' })
        .every((link) => link.getAttribute('href') === '/dashboard/orders/47')
    ).toBe(true)
    expect(within(table).getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(customersService.list).not.toHaveBeenCalled()
  })
  it('uses email for blank names and a dash for absent comment/admin response', async () => {
    vi.mocked(storeRatingsService.list).mockResolvedValue(
      paginated([
        normalizeStoreRating({
          ...rawStoreRating,
          comment: null,
          user: { ...rawStoreRating.user, first_name: '', last_name: null },
        }),
      ])
    )
    renderPage()
    const table = await screen.findByRole('table')
    const row = within(table).getAllByRole('row')[1]
    expect(within(row).getAllByRole('cell')[0]).toHaveTextContent('abdullah.essam@gmail.com')
    expect(within(row).getAllByRole('cell')[2]).toHaveTextContent('—')
    expect(within(row).getAllByRole('cell')[5]).toHaveTextContent('—')
  })
  it('shows responsive loading then an understandable empty state', async () => {
    let resolve!: (value: PaginatedData<StoreRating>) => void
    vi.mocked(storeRatingsService.list).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    renderPage()
    expect(screen.getByTestId('query-loading-state')).toHaveAttribute('aria-busy', 'true')
    await act(async () => resolve(paginated([])))
    expect(await screen.findByText('No store ratings found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
  })
  it('retries an initial failure without exposing Error.message', async () => {
    vi.mocked(storeRatingsService.list).mockRejectedValueOnce(new Error('internal details'))
    const user = userEvent.setup()
    renderPage()
    await screen.findByTestId('query-state-loading-error')
    expect(screen.queryByText('internal details')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: i18n.t('queryState.actions.retry') }))
    expect(await screen.findAllByText('جميل جدا')).toHaveLength(2)
  })
  it('preserves loaded rows during a background failure', async () => {
    const { client } = renderPage()
    await screen.findByRole('table')
    vi.mocked(storeRatingsService.list).mockRejectedValueOnce(new Error('internal details'))
    await act(() => client.invalidateQueries({ queryKey: storeRatingsKeys.lists() }))
    expect(await screen.findByTestId('query-state-refetch-error')).toBeInTheDocument()
    expect(screen.getAllByText('جميل جدا')).toHaveLength(2)
  })
  it.each([
    {
      query: 'rating_min=5&rating_max=2',
      message: 'Minimum rating cannot exceed maximum rating.',
      ratingInvalid: true,
    },
    {
      query: 'date_from=2026-02-30',
      message: 'Enter valid dates with the start date on or before the end date.',
      ratingInvalid: false,
    },
    {
      query: 'date_from=2026-10-20&date_to=2026-10-01',
      message: 'Enter valid dates with the start date on or before the end date.',
      ratingInvalid: false,
    },
  ])(
    'disables malformed applied filters $query and keeps validation independent',
    async ({ query, message, ratingInvalid }) => {
      const user = userEvent.setup()
      renderPage(`/dashboard/store-ratings?${query}`)
      expect(screen.getByRole('alert')).toHaveTextContent(message)
      expect(storeRatingsService.list).not.toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'Filter' }))
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByRole('group', { name: 'Rating range' })).toHaveAttribute(
        'aria-invalid',
        String(ratingInvalid)
      )
      expect(within(dialog).getByLabelText('Date From')).toHaveAttribute('aria-invalid', String(!ratingInvalid))
      expect(storeRatingsService.list).not.toHaveBeenCalled()
    }
  )
  it('keeps invalid draft dates local and prevents Apply', async () => {
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('table')
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    fireEvent.change(screen.getByLabelText('Date From'), { target: { value: '2026-10-20' } })
    fireEvent.change(screen.getByLabelText('Date To'), { target: { value: '2026-10-01' } })
    expect(storeRatingsService.list).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Enter valid dates')
    expect(screen.getByRole('group', { name: 'Rating range' })).toHaveAttribute('aria-invalid', 'false')
    expect(storeRatingsService.list).toHaveBeenCalledTimes(1)
  })
  it('retains filters on next pages and restarts page 1 after Apply and Reset', async () => {
    const list = vi
      .mocked(storeRatingsService.list)
      .mockImplementation(async (page, _signal, filters) =>
        paginated([{ ...item, id: page, comment: `Page ${page}` }], page, filters?.rating === 5 ? 2 : 1)
      )
    const user = userEvent.setup()
    renderPage(
      '/dashboard/store-ratings?user_id=1&rating=5&rating_min=1&rating_max=5&date_from=2026-01-01&sort_by=rating&sort_dir=desc&page=9'
    )
    await screen.findAllByText('Page 2')
    const applied = {
      ...emptyStoreRatingsFilters,
      userId: 1,
      rating: 5,
      ratingMin: 1,
      ratingMax: 5,
      dateFrom: '2026-01-01',
      sortBy: 'rating',
      sortDir: 'desc',
    }
    expect(list).toHaveBeenCalledWith(1, expect.any(AbortSignal), applied)
    expect(list).toHaveBeenCalledWith(2, expect.any(AbortSignal), applied)
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    expect(screen.getAllByRole('combobox')).toHaveLength(6)
    expect(screen.queryByLabelText('Product')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
    await user.click(screen.getByRole('combobox', { name: 'Rating' }))
    await user.click(await screen.findByRole('option', { name: '3' }))
    expect(list).toHaveBeenCalledTimes(2)
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(list).toHaveBeenCalledWith(1, expect.any(AbortSignal), { ...applied, rating: 3 }))
    expect(screen.queryByText('Page 2')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => expect(list).toHaveBeenCalledWith(1, expect.any(AbortSignal), emptyStoreRatingsFilters))
  })
  it('uses the remote customer selector only when filters open and serializes the selected user', async () => {
    vi.mocked(customersService.list).mockResolvedValue(
      paginated([
        {
          id: 9,
          name: 'Remote Customer',
          firstName: 'Remote',
          lastName: 'Customer',
          email: 'customer@example.test',
          phone: null,
          status: 'active',
          isBlocked: false,
          blockedAt: null,
          blockedReason: null,
          ordersCount: 0,
          lifetimeSpend: 0,
          createdAt: '',
          updatedAt: '',
        },
      ])
    )
    const user = userEvent.setup()
    renderPage()
    await screen.findByRole('table')
    expect(customersService.list).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('combobox', { name: 'User' }))
    await user.click(await screen.findByRole('option', { name: 'Remote Customer' }))
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() =>
      expect(storeRatingsService.list).toHaveBeenLastCalledWith(1, expect.any(AbortSignal), {
        ...emptyStoreRatingsFilters,
        userId: 9,
      })
    )
    expect(customersService.list).toHaveBeenCalledTimes(1)
  })
  it('confirms approval, prevents duplicate submissions, and refreshes only its lists', async () => {
    let resolve!: () => void
    const moderate = vi.spyOn(storeRatingsService, 'moderate').mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const user = userEvent.setup()
    const { client } = renderPage()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const dialog = await openModeration(user, 'approve')
    expect(moderate).not.toHaveBeenCalled()
    expect(dialog).toHaveTextContent('rating #2 by abdullah essam for order RF-10047')
    const confirm = within(dialog).getByRole('button', { name: 'Approve' })
    await user.dblClick(confirm)
    expect(moderate).toHaveBeenCalledExactlyOnceWith(2, 'approved')
    expect(within(dialog).getByRole('button', { name: 'Approving…' })).toBeDisabled()
    vi.mocked(storeRatingsService.list).mockResolvedValue(paginated([{ ...item, status: 'approved' }]))
    await act(async () => resolve())
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getAllByText('Approved')).toHaveLength(2)
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: storeRatingsKeys.lists() })
    expect(screen.queryByRole('button', { name: /Moderation actions/ })).not.toBeInTheDocument()
  })
  it('retains the row and confirmation after failure with safe feedback', async () => {
    vi.spyOn(storeRatingsService, 'moderate').mockRejectedValue(new Error('secret details'))
    const user = userEvent.setup()
    renderPage()
    const dialog = await openModeration(user, 'reject')
    await user.click(within(dialog).getByRole('button', { name: 'Reject' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Store rating could not be rejected.'))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getAllByText('جميل جدا')).toHaveLength(2)
    expect(screen.queryByText('secret details')).not.toBeInTheDocument()
  })
  it('renders Arabic labels, RTL, shared statuses and keyboard accessible actions', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'تقييمات المتجر' })).toBeInTheDocument()
    expect(document.documentElement.dir).toBe('rtl')
    expect(await screen.findAllByText(i18n.t('reviews.status.pending'))).toHaveLength(2)
    const trigger = screen.getAllByRole('button', {
      name: i18n.t('storeRatings.actions.forRating', { name: 'abdullah essam', order: 'RF-10047', id: 2 }),
    })[0]
    trigger.focus()
    await user.keyboard('{Enter}')
    expect(
      await screen.findByRole('menuitem', {
        name: i18n.t('storeRatings.actions.approveNamed', { name: 'abdullah essam', order: 'RF-10047', id: 2 }),
      })
    ).toBeInTheDocument()
  })
  it('aligns English and Arabic translation keys apart from locale plural forms', () => {
    const keys = (value: object): string[] =>
      Object.entries(value)
        .flatMap(([key, entry]) =>
          typeof entry === 'object' && entry !== null ? keys(entry).map((child) => `${key}.${child}`) : [key]
        )
        .filter((key) => !key.startsWith('total_'))
        .sort()
    expect(keys(en.storeRatings)).toEqual(keys(ar.storeRatings))
  })
})
