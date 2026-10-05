import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { contactMessagesKeys } from '../queries/contact-messages.keys'
import { normalizeContactMessage } from '../utils/contact-message-normalizers'
import { rawContactMessageSchema } from '../schemas/contact-message.schema'
import index from './contact-messages-index.fixture.json'
import { installDomMocks, renderMessages } from './test-utils'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast }))
let canonical: unknown
beforeEach(async () => {
  vi.clearAllMocks()
  installDomMocks()
  await i18n.changeLanguage('en')
  canonical = index.data[0]
  http.get.mockImplementation(async ({ url }: { url: string }) => ({
    data: url === '/dashboard/contact-messages' ? index : { success: true, data: canonical },
  }))
})
afterEach(() => vi.unstubAllGlobals())
async function chooseStatus(label: string) {
  await userEvent.click(screen.getByRole('combobox', { name: 'Change Status' }))
  await userEvent.click(screen.getByRole('option', { name: label }))
}
describe('Contact Message Detail', () => {
  it('renders the full guest message, contact and dates with GET only and no auto-read', async () => {
    renderMessages('/dashboard/contact-messages/49')
    await screen.findByRole('heading', { name: 'Contact Message #49', level: 1 })
    for (const label of ['Message', 'Contact Information', 'Source / Account', 'Status', 'Dates'])
      expect(screen.getByRole('heading', { name: label, level: 2 })).toBeInTheDocument()
    for (const value of ['test tets tes', 'test@test.com', '01091043660', 'Guest'])
      expect(screen.getByText(value)).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Change Status' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Status' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete contact message 49' })).toBeInTheDocument()
    expect(document.querySelectorAll('time')).toHaveLength(2)
    expect(http.get).toHaveBeenCalledTimes(1)
    expect(http.patch).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
  })
  it('rejects /40 -> 49 without displaying the wrong message and recovers via Retry', async () => {
    renderMessages('/dashboard/contact-messages/40')
    expect(await screen.findByText('Unable to load content')).toBeInTheDocument()
    expect(screen.queryByText('test tets tes')).not.toBeInTheDocument()
    expect(screen.queryByText('Contact message identity mismatch')).not.toBeInTheDocument()
    canonical = { ...index.data[0], id: 40 }
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Contact Message #40' })).toBeInTheDocument()
  })
  it('rejects invalid route IDs without a request', () => {
    renderMessages('/dashboard/contact-messages/invalid')
    expect(screen.getByRole('alert')).toHaveTextContent('This contact message ID is invalid')
    expect(http.get).not.toHaveBeenCalled()
  })
  it.each(['en', 'ar'])('distinguishes the registered account from contact identity in %s', async (language) => {
    await i18n.changeLanguage(language)
    canonical = index.data[4]
    renderMessages('/dashboard/contact-messages/45')
    await screen.findByRole('heading', { name: i18n.t('contactMessages.detailTitle', { id: 45 }) })
    const account = screen.getByRole('heading', { name: i18n.t('contactMessages.fields.account') }).closest('section')
    if (!account) throw new Error('Missing account section')
    expect(within(account).getByText('abdullah essam')).toBeInTheDocument()
    expect(within(account).getByText('abdullah.essam@gmail.com')).toBeInTheDocument()
    expect(screen.getByText('ليلى إبراهيم')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('contactMessages.unavailable'))).toBeInTheDocument()
    expect(document.querySelector('a[href*="customers"]')).toBeNull()
    expect(document.documentElement.dir).toBe(language === 'ar' ? 'rtl' : 'ltr')
  })
  it('renders malicious-looking multiline content as full text and unknown status neutrally', async () => {
    const message = '<script>alert(1)</script>\n' + 'Long message '.repeat(200)
    canonical = {
      ...index.data[0],
      subject: '<img src=x onerror=alert(1)>',
      message,
      status: 'future_status',
      status_label: 'Future Status',
    }
    const { container } = renderMessages('/dashboard/contact-messages/49')
    await screen.findByRole('heading', { name: 'Contact Message #49' })
    const body = screen.getByText((_, element) => element?.tagName === 'BDI' && element.textContent === message)
    expect(body.parentElement).toHaveClass('whitespace-pre-wrap', 'break-words')
    expect(body.textContent).toBe(message)
    expect(container.querySelector('script, img')).toBeNull()
    expect(screen.getAllByText('Future Status')[0].parentElement).toHaveClass('border')
    await userEvent.click(screen.getByRole('combobox', { name: 'Change Status' }))
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['New', 'Read', 'Resolved'])
    expect(http.patch).not.toHaveBeenCalled()
  })
})
describe('Contact Message status updates', () => {
  it.each(['en', 'ar'])('requires a selection with localized validation before transport (%s)', async (language) => {
    await i18n.changeLanguage(language)
    renderMessages('/dashboard/contact-messages/49')
    await screen.findByRole('heading', { name: i18n.t('contactMessages.detailTitle', { id: 49 }) })
    await userEvent.click(screen.getByRole('button', { name: i18n.t('contactMessages.saveStatus') }))
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true'))
    expect(screen.getByRole('combobox')).toHaveAccessibleDescription(i18n.t('contactMessages.chooseStatus'))
    expect(http.patch).not.toHaveBeenCalled()
  })
  it('requires explicit Save, sends JSON once, caches exact entity and invalidates only module queries', async () => {
    canonical = index.data[1]
    let resolve: (value: unknown) => void = () => {}
    http.patch.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { client } = renderMessages('/dashboard/contact-messages/41')
    const listCache = { pages: [{ extra: { newCount: 4, total: 9 } }], pageParams: [1] }
    client.setQueryData(contactMessagesKeys.list(), listCache)
    client.setQueryData(['unrelated'], ['keep'])
    await screen.findByRole('heading', { name: 'Contact Message #41' })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    await chooseStatus('Read')
    expect(http.patch).not.toHaveBeenCalled()
    const save = screen.getByRole('button', { name: 'Save Status' })
    fireEvent.click(save)
    fireEvent.click(save)
    await waitFor(() => expect(http.patch).toHaveBeenCalledTimes(1))
    expect(http.patch).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/contact-messages/41/status', data: { status: 'read' } })
    )
    expect(client.getQueryData(contactMessagesKeys.detail(41))).toMatchObject({ status: 'new' })
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    const updated = { ...index.data[1], status: 'read', status_label: 'Read', updated_at: '2026-10-04T17:44:09+00:00' }
    canonical = updated
    await act(async () =>
      resolve({ data: { success: true, message: 'Contact message status updated successfully', data: updated } })
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Status' })).toBeEnabled())
    expect(client.getQueryData(contactMessagesKeys.detail(41))).toEqual(
      normalizeContactMessage(rawContactMessageSchema.parse(updated))
    )
    expect(invalidate.mock.calls.map(([options]) => options)).toEqual([
      { queryKey: contactMessagesKeys.detail(41), exact: true },
      { queryKey: contactMessagesKeys.lists() },
    ])
    expect(client.getQueryData(contactMessagesKeys.list())).toEqual(listCache)
    expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false)
    expect(client.getMutationCache().getAll()[0].options.retry).toBe(false)
    expect(toast.success).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('combobox', { name: 'Change Status' }))
    expect(screen.queryByRole('option', { name: 'Read' })).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'New' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Resolved' })).toBeInTheDocument()
  })
  it.each([true, false])(
    'preserves canonical state and recoverable selection on failure (backend message: %s)',
    async (backendMessage) => {
      http.patch.mockRejectedValue(
        backendMessage
          ? { isAxiosError: true, response: { data: { message: 'Status change denied' } } }
          : new Error('raw operational stack')
      )
      const { client } = renderMessages('/dashboard/contact-messages/49')
      await screen.findByRole('heading', { name: 'Contact Message #49' })
      await chooseStatus('Resolved')
      await userEvent.click(screen.getByRole('button', { name: 'Save Status' }))
      expect(await screen.findByRole('alert')).toHaveTextContent(
        backendMessage ? 'Status change denied' : 'Could not update the status'
      )
      expect(screen.queryByText('raw operational stack')).not.toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Change Status' })).toHaveTextContent('Resolved')
      expect(client.getQueryData(contactMessagesKeys.detail(49))).toMatchObject({ status: 'new' })
      expect(http.patch).toHaveBeenCalledTimes(1)
      expect(toast.success).not.toHaveBeenCalled()
    }
  )
})
describe('Contact Message detail deletion', () => {
  it('accepts no-data success, removes exact cache and leaves deleted Detail', async () => {
    http.delete.mockResolvedValue({ data: { success: true, message: 'Contact message deleted successfully' } })
    const { client } = renderMessages('/dashboard/contact-messages/49')
    await screen.findByRole('heading', { name: 'Contact Message #49' })
    await userEvent.click(screen.getByRole('button', { name: 'Delete contact message 49' }))
    expect(http.delete).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/dashboard\/contact-messages$/))
    expect(screen.queryByRole('heading', { name: 'Contact Message #49' })).not.toBeInTheDocument()
    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(client.getQueryData(contactMessagesKeys.detail(49))).toBeUndefined()
    expect(http.get.mock.calls.filter(([request]) => request.url.endsWith('/49'))).toHaveLength(1)
  })
  it('can close confirmation with Escape and reopen it', async () => {
    renderMessages('/dashboard/contact-messages/49')
    await screen.findByRole('heading', { name: 'Contact Message #49' })
    await userEvent.click(screen.getByRole('button', { name: 'Delete contact message 49' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Delete contact message 49' }))
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(http.delete).not.toHaveBeenCalled()
  })
})
