import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import ReturnRequestDetailPage from '../pages/ReturnRequestDetailPage'
import { returnRequestsKeys } from '../queries/return-requests.keys'
import { normalizeReturnRequest } from '../utils/return-request-normalizers'
import approved from './return-request-approved.fixture.json'
import show from './return-request-show.fixture.json'
import nullCommentIndex from './return-requests-index-null-comment.fixture.json'
import { installDomMocks, renderReturnRequests } from './test-utils'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast }))

let canonical: unknown
beforeEach(async () => {
  vi.clearAllMocks()
  installDomMocks()
  await i18n.changeLanguage('en')
  canonical = show
  http.get.mockImplementation(async () => ({ data: canonical }))
})
afterEach(() => vi.unstubAllGlobals())

describe('Return Request Show', () => {
  it.each(['en', 'ar'])('renders nullable comments with a localized fallback (%s)', async (language) => {
    await i18n.changeLanguage(language)
    canonical = { success: true, data: nullCommentIndex.data[0] }
    const { client } = renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/1')
    await screen.findByRole('heading', { name: i18n.t('returnRequests.requestTitle', { id: 1 }), level: 1 })
    const section = screen.getByRole('heading', { name: i18n.t('returnRequests.sections.reason') }).closest('section')
    if (!section) throw new Error('Missing reason section')
    expect(within(section).getByText(i18n.t('returnRequests.unavailable'))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'RF-10022' })).toHaveAttribute('href', '/dashboard/orders/22')
    expect(screen.getAllByText('magedelshafey98@gmail.com')).toHaveLength(2)
    expect(client.getQueryData(returnRequestsKeys.detail(1))).toMatchObject({ comment: null })
  })
  it.each(['', '   '])('shows unavailable for blank detail comment %j', async (comment) => {
    canonical = { ...show, data: { ...show.data, comment } }
    renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    await screen.findByRole('heading', { name: 'Return Request #31' })
    const section = screen.getByRole('heading', { name: 'Return Reason' }).closest('section')
    if (!section) throw new Error('Missing reason section')
    expect(within(section).getByText('Unavailable')).toBeInTheDocument()
  })
  it('renders unknown status and reason read-only without rejecting future backend values', async () => {
    canonical = {
      ...show,
      data: { ...show.data, status: 'future_status', reason: 'future_reason', reason_label: 'Other reason' },
    }
    renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    await screen.findByRole('heading', { name: 'Return Request #31' })
    expect(screen.getAllByText('future status')).toHaveLength(2)
    expect(screen.getByText('Other reason')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })
  it('renders the exact pending detail, safe user fallback, Order link, decision fallback, and pending actions', async () => {
    renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    await screen.findByRole('heading', { name: 'Return Request #31', level: 1 })
    for (const title of ['Return Request', 'Order', 'Customer', 'Return Reason', 'Decision', 'Dates'])
      expect(screen.getByRole('heading', { name: title, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'RF-10047' })).toHaveAttribute('href', '/dashboard/orders/47')
    expect(screen.getAllByText('abdullah.essam@gmail.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
    expect(screen.getByText('Damaged')).toBeInTheDocument()
    const decision = screen.getByRole('heading', { name: 'Decision', level: 2 }).closest('section')
    if (!decision) throw new Error('Missing Decision section')
    expect(within(decision).getAllByText('Unavailable')).toHaveLength(4)
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
  })
  it('renders the approved canonical entity read-only with decision metadata and returned Order status', async () => {
    canonical = approved
    renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    await screen.findByRole('heading', { name: 'Return Request #31' })
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0)
    expect(screen.getByText('returned')).toBeInTheDocument()
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
    expect(screen.getByText('admin@admin.com')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })
  it('rejects invalid route IDs and recovers a failed Show through Retry', async () => {
    const invalid = renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/invalid')
    expect(screen.getByRole('alert')).toHaveTextContent('This return request ID is invalid')
    expect(http.get).not.toHaveBeenCalled()
    invalid.unmount()
    http.get.mockRejectedValueOnce(new Error('raw database error'))
    renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    expect(await screen.findByText('Unable to load content')).toBeInTheDocument()
    expect(screen.queryByText('raw database error')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Return Request #31' })).toBeInTheDocument()
  })
})

describe('Approve Return Request', () => {
  it('sends nullable JSON once, locks duplicates, updates exact cache, refetches detail, and invalidates only lists', async () => {
    let resolve: (value: unknown) => void = () => {}
    http.post.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { client } = renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    client.setQueryDefaults(['unrelated'], { gcTime: Infinity })
    client.setQueryData(returnRequestsKeys.list(), { items: [], meta: { currentPage: 1, perPage: 15 } })
    client.setQueryData(['unrelated'], ['keep'])
    await screen.findByRole('heading', { name: 'Return Request #31' })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    const confirm = screen.getByRole('button', { name: 'Confirm Approval' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await waitFor(() => expect(http.post).toHaveBeenCalledTimes(1))
    expect(http.post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/dashboard/return-requests/31/approve',
        data: { decision_note: null },
      })
    )
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled()
    canonical = approved
    await act(async () => resolve({ data: approved }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(returnRequestsKeys.detail(31))).toEqual(normalizeReturnRequest(approved.data))
    expect(invalidate.mock.calls.map((call) => call[0])).toEqual([
      { queryKey: returnRequestsKeys.detail(31), exact: true },
      { queryKey: returnRequestsKeys.lists() },
    ])
    expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false)
    expect(http.get).toHaveBeenCalledTimes(2)
    expect(client.getMutationCache().getAll()[0].options.retry).toBe(false)
  })
  it('trims and sends a nonblank optional approval note', async () => {
    http.post.mockImplementation(async () => {
      canonical = approved
      return { data: approved }
    })
    renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    await screen.findByRole('heading', { name: 'Return Request #31' })
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Decision Note' }), '  Verified  ')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Approval' }))
    await waitFor(() =>
      expect(http.post).toHaveBeenCalledWith(expect.objectContaining({ data: { decision_note: 'Verified' } }))
    )
  })
})

describe('Reject Return Request', () => {
  it('requires a nonblank note and sends no request for blank or whitespace input', async () => {
    renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    await screen.findByRole('heading', { name: 'Return Request #31' })
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Rejection' }))
    expect(await screen.findByText('Decision note is required.')).toBeInTheDocument()
    expect(http.post).not.toHaveBeenCalled()
    await userEvent.type(screen.getByRole('textbox', { name: 'Decision Note' }), '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Rejection' }))
    expect(http.post).not.toHaveBeenCalled()
  })
  it('treats a success envelope without entity data as success and refetches canonical detail/list', async () => {
    let resolve: (value: unknown) => void = () => {}
    http.post.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { client } = renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    client.setQueryDefaults(['orders'], { gcTime: Infinity })
    client.setQueryData(['orders', 'detail', 47], { status: 'delivered' })
    client.setQueryData(returnRequestsKeys.list(), { items: [], meta: { currentPage: 1, perPage: 15 } })
    await screen.findByRole('heading', { name: 'Return Request #31' })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    await userEvent.type(screen.getByRole('textbox', { name: 'Decision Note' }), '  Return does not meet policy.  ')
    const confirm = screen.getByRole('button', { name: 'Confirm Rejection' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await waitFor(() => expect(http.post).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'Decision Note' })).toBeDisabled()
    expect(client.getQueryData(returnRequestsKeys.detail(31))).toMatchObject({ status: 'pending' })
    await act(async () => resolve({ data: { success: true, message: 'Decision saved' } }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(http.post).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/dashboard/return-requests/31/reject',
        data: { decision_note: 'Return does not meet policy.' },
      })
    )
    expect(toast.success).toHaveBeenCalledWith('Decision saved')
    expect(http.get).toHaveBeenCalledTimes(2)
    expect(invalidate.mock.calls.map((call) => call[0])).toEqual([
      { queryKey: returnRequestsKeys.detail(31), exact: true },
      { queryKey: returnRequestsKeys.lists() },
    ])
    expect(client.getMutationCache().getAll()[0].options.retry).toBe(false)
    expect(client.getQueryState(['orders', 'detail', 47])?.isInvalidated).toBe(false)
    expect(client.getQueryData(['orders', 'detail', 47])).toEqual({ status: 'delivered' })
  })
  it('retains the dialog/note, maps safe field feedback, and preserves canonical status on failure', async () => {
    const error = {
      isAxiosError: true,
      response: {
        data: {
          message: 'The decision could not be saved',
          errors: { decision_note: ['Decision note was rejected.'] },
        },
      },
    }
    http.post.mockRejectedValue(error)
    const { client } = renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    await screen.findByRole('heading', { name: 'Return Request #31' })
    await userEvent.click(screen.getByRole('button', { name: 'Reject' }))
    const textarea = screen.getByRole('textbox', { name: 'Decision Note' })
    await userEvent.type(textarea, 'Keep this note')
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Rejection' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The decision could not be saved')
    expect(screen.getByText('Decision note was rejected.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(textarea).toHaveValue('Keep this note')
    expect(textarea).toHaveAttribute('aria-invalid', 'true')
    expect(textarea).toHaveAccessibleDescription('Decision note was rejected.')
    expect(client.getQueryData(returnRequestsKeys.detail(31))).toMatchObject({ status: 'pending' })
    expect(http.post).toHaveBeenCalledTimes(1)
    expect(toast.error).not.toHaveBeenCalled()
    await waitFor(() => expect(http.get).toHaveBeenCalledTimes(2))
  })
  it.each(['Approve', 'Reject'])(
    'keeps %s open with the note and localized fallback for raw errors',
    async (action) => {
      http.post.mockRejectedValue(new Error('Internal database stack must stay hidden'))
      renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
      await screen.findByRole('heading', { name: 'Return Request #31' })
      await userEvent.click(screen.getByRole('button', { name: action }))
      const textarea = screen.getByRole('textbox', { name: 'Decision Note' })
      await userEvent.type(textarea, 'Retained note')
      await userEvent.click(
        screen.getByRole('button', { name: action === 'Approve' ? 'Confirm Approval' : 'Confirm Rejection' })
      )
      expect(await screen.findByRole('alert')).toHaveTextContent(
        i18n.t(action === 'Approve' ? 'returnRequests.feedback.approveError' : 'returnRequests.feedback.rejectError')
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(textarea).toHaveValue('Retained note')
      expect(screen.queryByText('Internal database stack must stay hidden')).not.toBeInTheDocument()
      expect(http.post).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('heading', { name: 'Return Request #31', hidden: true })).toBeInTheDocument()
    }
  )
  it('refetches after an already-decided race and removes actions from canonical non-pending state', async () => {
    http.post.mockImplementation(async () => {
      canonical = approved
      throw {
        isAxiosError: true,
        response: { data: { message: 'This request was already decided' } },
      }
    })
    renderReturnRequests(<ReturnRequestDetailPage />, '/dashboard/return-requests/31')
    await screen.findByRole('heading', { name: 'Return Request #31' })
    await userEvent.click(screen.getByRole('button', { name: 'Approve' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Approval' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0)
    expect(http.post).toHaveBeenCalledTimes(1)
  })
})
