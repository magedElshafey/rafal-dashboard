import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { formatDateTime } from '@/utils/date/date.helpers'
import ReturnRequestsPage from '../pages/ReturnRequestsPage'
import { returnRequestsKeys } from '../queries/return-requests.keys'
import ordersIndex from '../../orders/__tests__/orders-index.fixture.json'
import index from './return-requests-index.fixture.json'
import nullCommentIndex from './return-requests-index-null-comment.fixture.json'
import { installDomMocks, renderReturnRequests } from './test-utils'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))

const returnRequestCalls = () => http.get.mock.calls.filter(([request]) => request.url === '/dashboard/return-requests')

function installFilterBackend(itemCount = 1) {
  const requests = Array.from({ length: itemCount }, (_, itemIndex) => ({
    ...index.data[0],
    id: itemIndex + 1,
    order: { ...index.data[0].order, id: 21, order_number: 'RF-10021' },
  }))

  http.get.mockImplementation(async (request) => {
    if (request.url === '/dashboard/orders') return { data: ordersIndex }
    const page = Number(request.query?.page ?? 1)
    return {
      data: {
        ...index,
        data: requests.slice((page - 1) * 15, page * 15),
        meta: { current_page: page, per_page: 15 },
      },
    }
  })
}

beforeEach(async () => {
  vi.clearAllMocks()
  installDomMocks()
  await i18n.changeLanguage('en')
  http.get.mockResolvedValue({ data: index })
})
afterEach(() => vi.unstubAllGlobals())

describe('Return Requests Index', () => {
  it.each(['en', 'ar'])(
    'renders the real nullable-comment response successfully in both views (%s)',
    async (language) => {
      await i18n.changeLanguage(language)
      http.get.mockResolvedValue({ data: nullCommentIndex })
      const { container, client } = renderReturnRequests(<ReturnRequestsPage />)
      await screen.findAllByText('RF-10022')
      expect(client.getQueryState(returnRequestsKeys.list())?.status).toBe('success')
      expect(client.getQueryState(returnRequestsKeys.list())?.error).toBeNull()
      expect(client.getQueryData(returnRequestsKeys.list())).toMatchObject({
        pages: [{ items: [{ comment: null }] }],
      })
      expect(document.documentElement).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr')
      expect(screen.queryByText(i18n.t('queryState.loadingError.title'))).not.toBeInTheDocument()
      for (const selector of ['responsive-data-desktop', 'responsive-data-mobile-cards']) {
        const root = container.querySelector(`[data-slot=${selector}]`)
        if (!(root instanceof HTMLElement)) throw new Error('Missing responsive view')
        expect(within(root).getByText('magedelshafey98@gmail.com').tagName).toBe('BDI')
        expect(within(root).getByText(i18n.t('returnRequests.unavailable'))).toBeInTheDocument()
        expect(within(root).getByText(i18n.t('returnRequests.status.pending'))).toBeInTheDocument()
        expect(
          within(root).getByRole('button', { name: i18n.t('returnRequests.viewNamed', { id: 1 }) })
        ).toBeInTheDocument()
        expect(root.querySelector('[title=""]')).toBeNull()
      }
      await userEvent.click(screen.getAllByRole('button', { name: i18n.t('returnRequests.viewNamed', { id: 1 }) })[0])
      expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/return-requests/1')
    }
  )
  it.each(['', '   '])('shows unavailable without an empty title for blank comment %j', async (comment) => {
    http.get.mockResolvedValue({ data: { ...index, data: [{ ...index.data[0], comment }] } })
    renderReturnRequests(<ReturnRequestsPage />)
    const comments = await screen.findAllByText('Unavailable')
    expect(comments).toHaveLength(2)
    for (const comment of comments) expect(comment.closest('[title]')).toBeNull()
  })
  it('renders the exact backend page in responsive desktop and mobile views with safe identity and navigation', async () => {
    const { container } = renderReturnRequests(<ReturnRequestsPage />)
    await screen.findAllByText('RF-10047')
    const desktop = container.querySelector('[data-slot=responsive-data-desktop]')
    const mobile = container.querySelector('[data-slot=responsive-data-mobile-cards]')
    expect(desktop).toHaveClass('hidden', 'lg:block')
    expect(mobile).toHaveClass('lg:hidden')
    for (const root of [desktop, mobile]) {
      if (!(root instanceof HTMLElement)) throw new Error('Missing responsive view')
      for (const text of [
        'abdullah.essam@gmail.com',
        'Pending',
        'Damaged',
        'no comment',
        formatDateTime(index.data[0].created_at, { locale: 'en' }),
      ])
        expect(within(root).getByText(text)).toBeInTheDocument()
      expect(within(root).getByRole('button', { name: 'View return request 31' })).toBeInTheDocument()
    }
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'View return request 31' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/return-requests/31')
  })
  it('bounds long desktop comments without changing their accessible value', async () => {
    const comment = 'A very long customer comment that must remain available while preserving the table layout.'
    http.get.mockResolvedValue({
      data: { ...index, data: [{ ...index.data[0], comment }] },
    })
    renderReturnRequests(<ReturnRequestsPage />)
    const values = await screen.findAllByTitle(comment)
    expect(values[0]).toHaveClass('lg:line-clamp-2', 'lg:max-w-64')
    expect(values[0]).toHaveTextContent(comment)
  })
  it('shows a stable loading state and then the empty state', async () => {
    let resolve: (value: unknown) => void = () => {}
    http.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    renderReturnRequests(<ReturnRequestsPage />)
    expect(screen.getByText('Loading content...')).toBeInTheDocument()
    await act(async () => resolve({ data: { ...index, data: [] } }))
    expect(await screen.findByText('No return requests')).toBeInTheDocument()
  })
  it('recovers an initial safe error through Retry without exposing raw errors', async () => {
    http.get.mockRejectedValueOnce(new Error('database password'))
    renderReturnRequests(<ReturnRequestsPage />)
    expect(await screen.findByText('Unable to load content')).toBeInTheDocument()
    expect(screen.queryByText('database password')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findAllByText('RF-10047')).toHaveLength(2)
  })

  it('surfaces an invalid date range only after Apply without replacing the applied query', async () => {
    installFilterBackend()
    const user = userEvent.setup()
    renderReturnRequests(<ReturnRequestsPage />)

    await screen.findAllByText('RF-10021')
    const appliedRequestCount = returnRequestCalls().length
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByLabelText('Date from'), '2026-10-10')
    await user.type(screen.getByLabelText('Date to'), '2026-10-09')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Date from')).toHaveAttribute('aria-invalid', 'false')
    expect(returnRequestCalls()).toHaveLength(appliedRequestCount)

    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The date-from value cannot be after the date-to value.')
    expect(screen.getByLabelText('Date from')).toHaveAttribute('aria-describedby', 'return-requests-date-range-error')
    expect(screen.getByLabelText('Date to')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(returnRequestCalls()).toHaveLength(appliedRequestCount)
  })

  it('does not request an invalid applied deep-link date range', async () => {
    installFilterBackend()

    renderReturnRequests(<ReturnRequestsPage />, '/dashboard/return-requests?date_from=2026-10-10&date_to=2026-10-09')

    await waitFor(() => expect(returnRequestCalls()).toHaveLength(0))
  })

  it('keeps drafts unapplied, retains filters across pages, restarts pagination, and resets', async () => {
    installFilterBackend(16)
    const user = userEvent.setup()
    renderReturnRequests(<ReturnRequestsPage />, '/dashboard/return-requests?page=4&order_id=21')

    await waitFor(() =>
      expect(
        returnRequestCalls().some(([request]) => request.query?.page === 2 && request.query?.order_id === 21)
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Order' })).toHaveTextContent('#RF-10021'))
    const appliedRequestCount = returnRequestCalls().length
    await user.type(screen.getByLabelText('Date from'), '2026-10-01')
    expect(returnRequestCalls()).toHaveLength(appliedRequestCount)
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(
        returnRequestCalls().some(
          ([request]) =>
            request.query?.page === 1 && request.query?.order_id === 21 && request.query?.date_from === '2026-10-01'
        )
      ).toBe(true)
    )
    await waitFor(() =>
      expect(
        returnRequestCalls().some(
          ([request]) =>
            request.query?.page === 2 && request.query?.order_id === 21 && request.query?.date_from === '2026-10-01'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(
        returnRequestCalls().some(
          ([request]) =>
            request.query?.page === 1 && request.query?.order_id === undefined && request.query?.date_from === undefined
        )
      ).toBe(true)
    )
  })
})
