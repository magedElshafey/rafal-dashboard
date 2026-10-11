import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { formatDateTime } from '@/utils/date/date.helpers'
import { returnRequestsService } from '../api/return-requests.service'
import ReturnRequestDetailPage from '../pages/ReturnRequestDetailPage'
import { returnRequestsKeys } from '../queries/return-requests.keys'
import { normalizeReturnRequest } from '../utils/return-request-normalizers'
import en from '../locale/en.json'
import ar from '../locale/ar.json'
import show from './return-request-show.fixture.json'
import approved from './return-request-approved.fixture.json'
import { installDomMocks, renderReturnRequests } from './test-utils'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const path = '/dashboard/return-requests/31'
const ready = () => screen.findByRole('heading', { name: 'Return Request #31', level: 1 })

beforeEach(async () => {
  vi.clearAllMocks()
  http.get.mockReset().mockResolvedValue({ data: show })
  http.post.mockReset().mockResolvedValue({ data: approved })
  installDomMocks()
  await i18n.changeLanguage('en')
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Return review workspace', () => {
  it('performs one canonical Show with a signal, no enrichment, and contextual numeric-ID deep links', async () => {
    const service = vi.spyOn(returnRequestsService, 'show')
    const { client } = renderReturnRequests(<ReturnRequestDetailPage />, path)
    await ready()
    expect(service).toHaveBeenCalledExactlyOnceWith(31, expect.any(AbortSignal))
    expect(http.get).toHaveBeenCalledExactlyOnceWith({
      url: '/dashboard/return-requests/31',
      signal: expect.any(AbortSignal),
      suppressErrorNotification: true,
    })
    expect(
      client
        .getQueryCache()
        .getAll()
        .map(({ queryKey }) => queryKey)
    ).toEqual([returnRequestsKeys.detail(31)])
    expect(client.getQueryData(returnRequestsKeys.detail(31))).toEqual(normalizeReturnRequest(show.data))
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'View full order RF-10047' })).toHaveAttribute(
      'href',
      '/dashboard/orders/47'
    )
    expect(screen.getByRole('link', { name: 'View customer abdullah.essam@gmail.com' })).toHaveAttribute(
      'href',
      '/dashboard/customers/1'
    )
    const lifecycle = screen.getByRole('region', { name: 'Request lifecycle' })
    expect(within(lifecycle).getByRole('list').tagName).toBe('OL')
    expect(within(lifecycle).getAllByRole('listitem')).toHaveLength(2)
    expect(lifecycle.querySelectorAll('time')).toHaveLength(1)
    expect(lifecycle).toHaveTextContent('Awaiting admin decision')
    expect(lifecycle).toHaveTextContent(formatDateTime(show.data.created_at, { locale: 'en' }))
    expect(screen.getByRole('region', { name: 'Return Reason' })).toHaveTextContent('no comment')
  })

  it.each(['0', '-1', 'abc', '1.5', '1e2', '%2031', '31%20', '031', '9007199254740992'])(
    'rejects noncanonical ID %s without mounting Show',
    (id) => {
      const { client } = renderReturnRequests(<ReturnRequestDetailPage />, `/dashboard/return-requests/${id}`)
      expect(screen.getByRole('heading', { name: 'Return request not found' })).toBeInTheDocument()
      expect(http.get).not.toHaveBeenCalled()
      expect(client.getQueryCache().getAll()).toHaveLength(0)
    }
  )

  it('cancels Show on unmount', () => {
    http.get.mockImplementation(() => new Promise(() => {}))
    const { unmount } = renderReturnRequests(<ReturnRequestDetailPage />, path)
    const signal: AbortSignal = http.get.mock.calls[0][0].signal
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
  })

  it('renders initial 404 as Not Found with Back and no raw error', async () => {
    http.get.mockRejectedValue({ isAxiosError: true, message: 'private failure', response: { status: 404 } })
    renderReturnRequests(<ReturnRequestDetailPage />, path)
    expect(await screen.findByRole('heading', { name: 'Return request not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to return requests' })).toHaveAttribute(
      'href',
      '/dashboard/return-requests'
    )
    expect(screen.queryByText('private failure')).not.toBeInTheDocument()
    expect(http.get).toHaveBeenCalledTimes(1)
  })

  it.each([500, 404])(
    'keeps loaded context and disables decisions after background %s until scoped Retry succeeds',
    async (status) => {
      const { client } = renderReturnRequests(<ReturnRequestDetailPage />, path)
      await ready()
      http.get.mockRejectedValueOnce({ isAxiosError: true, message: 'private failure', response: { status } })
      await act(async () => {
        await client.invalidateQueries({ queryKey: returnRequestsKeys.detail(31), exact: true })
      })
      expect(await screen.findByTestId('query-state-refetch-error')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Return Request #31' })).toBeInTheDocument()
      for (const name of ['Approve', 'Reject']) expect(screen.getByRole('button', { name })).toBeDisabled()
      expect(screen.getByRole('link', { name: 'View full order RF-10047' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View customer abdullah.essam@gmail.com' })).toBeInTheDocument()
      expect(screen.queryByText('private failure')).not.toBeInTheDocument()
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
      await waitFor(() => expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled())
      expect(http.get).toHaveBeenCalledTimes(3)
      expect(http.get.mock.calls.every(([request]) => request.url === '/dashboard/return-requests/31')).toBe(true)
    }
  )

  it.each(['Approve', 'Reject'])(
    'blocks an already-open %s dialog immediately when detail starts refetching, then on failure',
    async (action) => {
      let fail!: (error: unknown) => void
      const { client } = renderReturnRequests(<ReturnRequestDetailPage />, path)
      await ready()
      await userEvent.click(screen.getByRole('button', { name: action }))
      const dialog = screen.getByRole('dialog')
      const note = within(dialog).getByRole('textbox', { name: 'Decision Note' })
      await userEvent.type(note, 'Retain note')
      const form = note.closest('form')
      if (!form) throw new Error('Missing decision form')
      http.get.mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            fail = reject
          })
      )
      let refresh!: Promise<void>
      act(() => {
        refresh = client.invalidateQueries({ queryKey: returnRequestsKeys.detail(31), exact: true })
        fireEvent.submit(form)
      })
      await waitFor(() => expect(note).toBeDisabled())
      expect(http.post).not.toHaveBeenCalled()
      await act(async () => {
        fail(new Error('private refresh failure'))
        await refresh
      })
      await waitFor(() =>
        expect(
          within(dialog).getByRole('button', { name: action === 'Approve' ? 'Confirm Approval' : 'Confirm Rejection' })
        ).toBeDisabled()
      )
      fireEvent.submit(form)
      expect(note).toHaveValue('Retain note')
      expect(http.post).not.toHaveBeenCalled()
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Review decision' })).toHaveFocus())
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
      await waitFor(() => expect(screen.getByRole('button', { name: action })).toBeEnabled())
    }
  )

  it.each([show, approved])(
    'shares major loading/loaded composition for status $data.status without focusable skeleton actions',
    async (response) => {
      let resolve!: (value: unknown) => void
      http.get.mockImplementation(
        () =>
          new Promise((done) => {
            resolve = done
          })
      )
      const { container } = renderReturnRequests(<ReturnRequestDetailPage />, path)
      const structure = () =>
        Array.from(container.querySelectorAll('section')).map((section) => ({
          title: section.querySelector('h2')?.textContent?.replace('Decision summary', 'Review decision'),
          section: section.className,
          grid: section.parentElement?.className,
          card: section.firstElementChild?.className,
        }))
      const before = structure()
      expect(before.map(({ title }) => title)).toEqual([
        'Return Reason',
        'Review decision',
        'Order',
        'Customer',
        'Request lifecycle',
        'Metadata',
      ])
      expect(container.querySelector('button,a,input,textarea,[tabindex]')).toBeNull()
      expect(screen.getByTestId('query-loading-state')).toHaveAttribute('aria-busy', 'true')
      expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(15)
      const decisionSize = container.querySelectorAll('section')[1].querySelector('h2')?.nextElementSibling?.className
      await act(async () => resolve({ data: response }))
      await ready()
      expect(structure()).toEqual(before)
      expect(container.querySelectorAll('section')[1].querySelector('h2')?.nextElementSibling?.className).toBe(
        decisionSize
      )
      expect(container.querySelector('[data-slot="skeleton"]')).toBeNull()
    }
  )

  it.each([
    [{ name: ' A Customer ', email: 'test@example.com' }, 'A Customer'],
    [{ name: ' ', email: 'test@example.com' }, 'test@example.com'],
    [{ name: ' ', email: ' ' }, 'Customer #1'],
  ])('shows only the backend Name while preserving customer link identity without lookup', async (user, label) => {
    http.get.mockResolvedValue({ data: { ...show, data: { ...show.data, user: { id: 1, ...user } } } })
    renderReturnRequests(<ReturnRequestDetailPage />, path)
    await ready()
    const customer = within(screen.getByRole('region', { name: 'Customer' }))
    expect(customer.getAllByRole('term').map((term) => term.textContent)).toEqual(
      user.name.trim() ? ['Name', 'Email'] : ['Email']
    )
    if (user.name.trim()) expect(customer.getByText('Name').nextElementSibling).toHaveTextContent(user.name.trim())
    else expect(customer.queryByText('Name')).not.toBeInTheDocument()
    expect(customer.getByText('Email').nextElementSibling).toHaveTextContent(user.email.trim() || '—')
    if (user.email.trim()) expect(customer.getAllByText(user.email.trim())).toHaveLength(1)
    if (!user.name.trim() && !user.email.trim()) expect(customer.queryByText('Customer #1')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: `View customer ${label}` })).toHaveAttribute(
      'href',
      '/dashboard/customers/1'
    )
    expect(http.get).toHaveBeenCalledTimes(1)
  })

  it.each(['en', 'ar'])('presents unknown status neutrally in the panel and lifecycle (%s)', async (language) => {
    await i18n.changeLanguage(language)
    // Even supplied metadata must not turn a future status into a known completed decision.
    http.get.mockResolvedValue({
      data: { ...approved, data: { ...approved.data, status: 'under_review', decision_note: 'Prior note' } },
    })
    renderReturnRequests(<ReturnRequestDetailPage />, path)
    await screen.findByRole('heading', { name: i18n.t('returnRequests.requestTitle', { id: 31 }) })
    const panel = screen.getByRole('region', { name: i18n.t('returnRequests.workspace.requestStatus') })
    expect(panel).toHaveTextContent('under review')
    expect(
      screen.queryByRole('heading', { name: i18n.t('returnRequests.workspace.decisionSummary') })
    ).not.toBeInTheDocument()
    expect(within(panel).queryByText(i18n.t('returnRequests.fields.decidedBy'))).not.toBeInTheDocument()
    expect(within(panel).queryByText(i18n.t('returnRequests.fields.decidedAt'))).not.toBeInTheDocument()
    expect(within(panel).queryByText(i18n.t('returnRequests.fields.decisionNote'))).not.toBeInTheDocument()
    const lifecycle = within(screen.getByRole('region', { name: i18n.t('returnRequests.workspace.lifecycle') }))
    const currentState = lifecycle.getAllByRole('listitem')[1]
    expect(currentState).toHaveTextContent(i18n.t('returnRequests.workspace.currentStatus'))
    expect(currentState).toHaveTextContent('under review')
    expect(currentState.querySelector('time')).toBeNull()
    expect(within(currentState).queryByText(i18n.t('returnRequests.fields.decision'))).not.toBeInTheDocument()
    expect(screen.queryByText('Super Admin')).not.toBeInTheDocument()
    expect(screen.queryByText('Prior note')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: i18n.t('returnRequests.actions.approve') })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: i18n.t('returnRequests.actions.reject') })).not.toBeInTheDocument()
    expect(http.get).toHaveBeenCalledTimes(1)
    expect(http.post).not.toHaveBeenCalled()
  })

  it.each([
    [{ id: 1, name: ' Admin Name ', email: 'admin@example.com' }, 'Admin Name'],
    [{ id: 1, name: ' ', email: 'admin@example.com' }, 'admin@example.com'],
    [{ id: 1, name: ' ', email: ' ' }, 'Admin #1'],
    [null, '—'],
  ])('renders rejected summaries with available actor fallback and blank note', async (actor, label) => {
    http.get.mockResolvedValue({
      data: {
        ...approved,
        data: { ...approved.data, status: 'rejected', decision_note: ' ', decided_by_admin: actor },
      },
    })
    renderReturnRequests(<ReturnRequestDetailPage />, path)
    await ready()
    const summary = within(screen.getByRole('region', { name: 'Decision summary' }))
    expect(summary.getByText('Rejected')).toBeInTheDocument()
    const note = summary.getByText('Decision Note').nextElementSibling
    expect(note).toHaveTextContent('—')
    expect(summary.getByText('Decided By').nextElementSibling).toHaveTextContent(label)
    expect(summary.getByText(formatDateTime(approved.data.decided_at, { locale: 'en' }))).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
  })

  it('preserves multiline text safely and humanizes an unknown reason without a backend label', async () => {
    const comment = 'First line\n<script>alert(1)</script>'
    http.get.mockResolvedValue({
      data: { ...show, data: { ...show.data, comment, reason: 'future_reason', reason_label: ' ' } },
    })
    renderReturnRequests(<ReturnRequestDetailPage />, path)
    await ready()
    const section = screen.getByRole('region', { name: 'Return Reason' })
    expect(section).toHaveTextContent('future reason')
    expect(section.querySelector('script')).toBeNull()
    expect(within(section).getByText(/First line/).textContent).toBe(comment)
  })

  it.each(['en', 'ar'])(
    'supports %s labels, direction, keyboard confirmation and required error association',
    async (language) => {
      await i18n.changeLanguage(language)
      renderReturnRequests(<ReturnRequestDetailPage />, path)
      await screen.findByRole('heading', { name: i18n.t('returnRequests.requestTitle', { id: 31 }) })
      expect(document.documentElement).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr')
      const reject = screen.getByRole('button', { name: i18n.t('returnRequests.actions.reject') })
      reject.focus()
      await userEvent.keyboard('{Enter}')
      const dialog = screen.getByRole('dialog', { name: i18n.t('returnRequests.actions.confirmRejection') })
      expect(dialog).toHaveAccessibleDescription(i18n.t('returnRequests.actions.rejectDescription', { id: 31 }))
      const note = within(dialog).getByRole('textbox', { name: i18n.t('returnRequests.fields.decisionNote') })
      expect(note).toBeRequired()
      expect(note).toHaveFocus()
      await userEvent.click(
        within(dialog).getByRole('button', { name: i18n.t('returnRequests.actions.confirmRejection') })
      )
      expect(
        await within(dialog).findByText(i18n.t('returnRequests.validation.decisionNoteRequired'))
      ).toBeInTheDocument()
      expect(note).toHaveAttribute('aria-invalid', 'true')
      expect(note).toHaveAccessibleDescription(i18n.t('returnRequests.validation.decisionNoteRequired'))
      await userEvent.click(within(dialog).getByRole('button', { name: i18n.t('returnRequests.actions.cancel') }))
      await waitFor(() => expect(reject).toHaveFocus())
      expect(http.post).not.toHaveBeenCalled()
      const keys = (value: object): string[] =>
        Object.entries(value).flatMap(([key, entry]) =>
          entry && typeof entry === 'object' ? keys(entry).map((child) => `${key}.${child}`) : [key]
        )
      expect(keys(en).sort()).toEqual(keys(ar).sort())
    }
  )
})
