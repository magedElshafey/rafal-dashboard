import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { formatDateTime } from '@/utils/date/date.helpers'
import { contactMessagesKeys } from '../queries/contact-messages.keys'
import index from './contact-messages-index.fixture.json'
import { installDomMocks, renderMessages } from './test-utils'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn() }))
const contactMessageCalls = () =>
  http.get.mock.calls.filter(([request]) => request.url === '/dashboard/contact-messages')

function installFilterBackend(itemCount = 1) {
  const messages = Array.from({ length: itemCount }, (_, itemIndex) => ({
    ...index.data[0],
    id: itemIndex + 1,
    name: `Contact ${itemIndex + 1}`,
  }))

  http.get.mockImplementation(async (request) => {
    const page = Number(request.query?.page ?? 1)
    return {
      data: {
        ...index,
        data: messages.slice((page - 1) * 15, page * 15),
        meta: {
          ...index.meta,
          current_page: page,
          last_page: Math.max(1, Math.ceil(messages.length / 15)),
          total: messages.length,
        },
      },
    }
  })
}
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast }))
beforeEach(async () => {
  vi.clearAllMocks()
  installDomMocks()
  await i18n.changeLanguage('en')
  http.get.mockResolvedValue({ data: index })
})
afterEach(() => vi.unstubAllGlobals())

describe('Contact Messages Index', () => {
  it('loads through the shared scroll sentinel, retains rows on failure, and retries the failed page', async () => {
    let intersect = () => {}
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          intersect = () => callback([{ isIntersecting: true }])
        }
        observe() {}
        disconnect() {}
      }
    )
    http.get
      .mockResolvedValueOnce({ data: { ...index, data: [index.data[0]], meta: { ...index.meta, last_page: 2 } } })
      .mockRejectedValueOnce(new Error('raw next page failure'))
      .mockResolvedValueOnce({
        data: { ...index, data: [index.data[1]], meta: { ...index.meta, current_page: 2, last_page: 2 } },
      })
    renderMessages()
    await screen.findAllByText('test@test.com')
    await act(async () => {
      intersect()
      intersect()
    })
    expect(await screen.findByText('Unable to refresh data')).toBeInTheDocument()
    expect(screen.getAllByText('test@test.com')).toHaveLength(2)
    expect(screen.queryByText('raw next page failure')).not.toBeInTheDocument()
    expect(http.get).toHaveBeenCalledTimes(2)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findAllByText('thelma.osinski@hotmail.com')).toHaveLength(2)
    await act(async () => intersect())
    expect(http.get.mock.calls.map(([request]) => request.query)).toEqual([{ page: 1 }, { page: 2 }, { page: 2 }])
  })
  it('preserves messages and exposes Retry on a background refresh failure', async () => {
    const { client } = renderMessages()
    await screen.findByText('New Messages: 4')
    http.get.mockRejectedValueOnce(new Error('raw refresh error'))
    await act(async () => {
      await client.invalidateQueries({ queryKey: contactMessagesKeys.list() })
    })
    expect(await screen.findByText('Unable to refresh data')).toBeInTheDocument()
    expect(screen.getAllByText('test@test.com')).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.queryByText('Unable to refresh data')).not.toBeInTheDocument())
  })
  it.each(['en', 'ar'])('renders both responsive views and backend counts in %s', async (language) => {
    await i18n.changeLanguage(language)
    const { container } = renderMessages()
    await screen.findByText(i18n.t('contactMessages.newCount', { count: 4 }))
    expect(screen.getByText(i18n.t('contactMessages.total', { count: 9 }))).toBeInTheDocument()
    for (const slot of ['responsive-data-desktop', 'responsive-data-mobile-cards']) {
      const root = container.querySelector(`[data-slot=${slot}]`)
      if (!(root instanceof HTMLElement)) throw new Error('Missing responsive view')
      const view = within(root)
      for (const value of [
        'test@test.com',
        '01091043660',
        'thelma.osinski@hotmail.com',
        '0512683968',
        'abdullah essam',
        'abdullah.essam@gmail.com',
        'test tets tes',
        'ليلى إبراهيم',
      ])
        expect(view.getByText(value)).toBeInTheDocument()
      for (const status of ['new', 'read', 'resolved'])
        expect(view.getAllByText(i18n.t(`contactMessages.status.${status}`)).length).toBeGreaterThan(0)
      expect(view.getAllByText(i18n.t('contactMessages.guest'))).toHaveLength(4)
      expect(view.getByText(i18n.t('contactMessages.registered'))).toBeInTheDocument()
      expect(view.getByRole('link', { name: i18n.t('contactMessages.viewNamed', { id: 49 }) })).toHaveAttribute(
        'href',
        '/dashboard/contact-messages/49'
      )
      expect(view.getByRole('button', { name: i18n.t('contactMessages.deleteNamed', { id: 49 }) })).toBeInTheDocument()
      expect(
        view.getByText(formatDateTime(index.data[0].created_at, { locale: language === 'ar' ? 'ar' : 'en' }))
      ).toBeInTheDocument()
    }
    expect(container.querySelector('[data-slot=responsive-data-desktop]')).toHaveClass('hidden', 'lg:block')
    expect(container.querySelector('[data-slot=responsive-data-mobile-cards]')).toHaveClass('lg:hidden')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(http.patch).not.toHaveBeenCalled()
  })
  it('shows invalid date validation only after Apply and keeps the applied query unchanged', async () => {
    installFilterBackend()
    const user = userEvent.setup()
    renderMessages('/dashboard/contact-messages?sort_by=name&sort_dir=asc')

    await screen.findAllByText('Contact 1')
    const appliedRequestCount = contactMessageCalls().length
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.type(screen.getByLabelText('Created From'), '2026-10-10')
    await user.type(screen.getByLabelText('Created To'), '2026-10-09')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Created From')).toHaveAttribute('aria-invalid', 'false')
    expect(contactMessageCalls()).toHaveLength(appliedRequestCount)

    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The created-from value cannot be after the created-to value.'
    )
    expect(screen.getByLabelText('Created From')).toHaveAttribute(
      'aria-describedby',
      'contact-messages-created-range-error'
    )
    expect(screen.getByLabelText('Created To')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(contactMessageCalls()).toHaveLength(appliedRequestCount)
    expect(contactMessageCalls().at(-1)?.[0].query).toMatchObject({ sort_by: 'name', sort_dir: 'asc' })
  })

  it('does not request an invalid applied deep-link date range', async () => {
    installFilterBackend()

    renderMessages('/dashboard/contact-messages?created_from=2026-10-10&created_to=2026-10-09')

    await waitFor(() => expect(contactMessageCalls()).toHaveLength(0))
  })

  it('keeps drafts unapplied, retains filters across pages, restarts pagination, and resets', async () => {
    let intersect = () => {}
    let observerCount = 0
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          observerCount += 1
          intersect = () => callback([{ isIntersecting: true }])
        }
        observe() {}
        disconnect() {}
      }
    )
    installFilterBackend(16)
    const user = userEvent.setup()
    renderMessages('/dashboard/contact-messages?page=4&created_from=2026-10-01&sort_by=status&sort_dir=asc')

    await waitFor(() =>
      expect(
        contactMessageCalls().some(
          ([request]) => request.query?.page === 1 && request.query?.created_from === '2026-10-01'
        )
      ).toBe(true)
    )
    await waitFor(() => expect(observerCount).toBeGreaterThan(0))
    await act(async () => intersect())
    await waitFor(() =>
      expect(
        contactMessageCalls().some(
          ([request]) =>
            request.query?.page === 2 &&
            request.query?.created_from === '2026-10-01' &&
            request.query?.sort_by === 'status' &&
            request.query?.sort_dir === 'asc'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const appliedRequestCount = contactMessageCalls().length
    await user.type(screen.getByLabelText('Created To'), '2026-10-09')
    expect(contactMessageCalls()).toHaveLength(appliedRequestCount)
    const observerCountBeforeApply = observerCount
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() =>
      expect(
        contactMessageCalls().some(
          ([request]) =>
            request.query?.page === 1 &&
            request.query?.created_from === '2026-10-01' &&
            request.query?.created_to === '2026-10-09' &&
            request.query?.sort_by === 'status' &&
            request.query?.sort_dir === 'asc'
        )
      ).toBe(true)
    )
    await waitFor(() => expect(observerCount).toBeGreaterThan(observerCountBeforeApply))
    await act(async () => intersect())
    await waitFor(() =>
      expect(
        contactMessageCalls().some(
          ([request]) => request.query?.page === 2 && request.query?.created_to === '2026-10-09'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(
        contactMessageCalls().some(
          ([request]) =>
            request.query?.page === 1 &&
            request.query?.created_from === undefined &&
            request.query?.created_to === undefined &&
            request.query?.sort_by === undefined &&
            request.query?.sort_dir === undefined
        )
      ).toBe(true)
    )
  })

  it('renders plain bounded content, unknown status, and unavailable contact methods', async () => {
    const message = '<img src=x onerror=alert(1)>\n' + 'long '.repeat(200)
    http.get.mockResolvedValue({
      data: {
        ...index,
        data: [
          {
            ...index.data[0],
            message,
            email: null,
            phone: null,
            status: 'future_status',
            status_label: 'Future Status',
          },
        ],
      },
    })
    const { container } = renderMessages()
    expect(await screen.findAllByText('Unavailable')).toHaveLength(2)
    expect(screen.getAllByText('Future Status')).toHaveLength(2)
    expect(screen.getAllByTitle(message, { normalizer: (value) => value })[0]).toHaveClass(
      'line-clamp-2',
      'whitespace-pre-wrap',
      'break-words'
    )
    expect(container.querySelector('img')).toBeNull()
  })
  it('shows stable loading then empty state', async () => {
    let resolve: (value: unknown) => void = () => {}
    http.get.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    renderMessages()
    expect(screen.getByText('Loading content...')).toBeInTheDocument()
    await act(async () => resolve({ data: { ...index, data: [], meta: { ...index.meta, total: 0, new_count: 0 } } }))
    expect(await screen.findByText('No contact messages')).toBeInTheDocument()
    expect(screen.getByText('New Messages: 0')).toBeInTheDocument()
  })
  it('shows safe initial errors and retries', async () => {
    http.get.mockRejectedValueOnce(new Error('raw database stack'))
    renderMessages()
    expect(await screen.findByText('Unable to load content')).toBeInTheDocument()
    expect(screen.queryByText('raw database stack')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('New Messages: 4')).toBeInTheDocument()
  })
  it('confirms delete once, keeps counts canonical, invalidates lists and renders the backend refresh', async () => {
    let resolve: (value: unknown) => void = () => {}
    http.delete.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { client } = renderMessages()
    await screen.findByText('New Messages: 4')
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete contact message 49' })[0])
    expect(http.delete).not.toHaveBeenCalled()
    const confirm = screen.getByRole('button', { name: 'Confirm Delete' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await waitFor(() => expect(http.delete).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled()
    expect(screen.getByText('New Messages: 4')).toBeInTheDocument()
    http.get.mockResolvedValue({
      data: { ...index, data: index.data.slice(1), meta: { ...index.meta, total: 8, new_count: 3 } },
    })
    await act(async () => resolve({ data: { success: true, message: 'Contact message deleted successfully' } }))
    expect(await screen.findByText('New Messages: 3')).toBeInTheDocument()
    expect(screen.getByText('Messages: 8')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: contactMessagesKeys.lists() })
    expect(client.getMutationCache().getAll()[0].options.retry).toBe(false)
  })
  it('keeps failed deletion recoverable, and supports cancel and reopening confirmation', async () => {
    http.delete.mockRejectedValue(new Error('Internal delete stack'))
    renderMessages()
    const button = (await screen.findAllByRole('button', { name: 'Delete contact message 49' }))[0]
    await userEvent.click(button)
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the message')
    expect(screen.queryByText('Internal delete stack')).not.toBeInTheDocument()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await userEvent.click(button)
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getAllByText('test@test.com')).toHaveLength(2)
  })
})
