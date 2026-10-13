import { onlineManager } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { ContactMessageStatusForm } from '../components/ContactMessageStatusForm'
import { ContactMessageDeleteDialog } from '../components/ContactMessageDeleteDialog'
import { contactMessagesKeys } from '../queries/contact-messages.keys'
import { rawContactMessageSchema } from '../schemas/contact-message.schema'
import { normalizeContactMessage } from '../utils/contact-message-normalizers'
import en from '../locale/en.json'
import ar from '../locale/ar.json'
import index from './contact-messages-index.fixture.json'
import { createClient, installDomMocks, queryWrapper, renderMessages } from './test-utils'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))
const raw = index.data[0]
const message = normalizeContactMessage(rawContactMessageSchema.parse(raw))
const key = contactMessagesKeys.detail(message.id)
const exact = { queryKey: key, exact: true }
const showResponse = { data: { success: true, data: raw } }
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
beforeEach(async () => {
  vi.clearAllMocks()
  installDomMocks()
  onlineManager.setOnline(true)
  await i18n.changeLanguage('en')
  http.get.mockImplementation(async ({ url }: { url: string }) =>
    url.endsWith('/49') ? showResponse : { data: index }
  )
})
afterEach(() => {
  onlineManager.setOnline(true)
  vi.unstubAllGlobals()
})
async function loaded() {
  const result = renderMessages('/dashboard/contact-messages/49')
  await screen.findByRole('button', { name: 'Save Status' })
  return result
}
async function selectStatus() {
  await userEvent.click(screen.getByRole('combobox', { name: 'Change Status' }))
  await userEvent.click(screen.getByRole('option', { name: 'Read' }))
}
const axiosFailure = (status: number) => ({ isAxiosError: true, response: { status } })

describe('Contact Detail initial and background states', () => {
  it.each(['en', 'ar'])('localizes initial 404 with a heading and Back (%s)', async (language) => {
    await i18n.changeLanguage(language)
    http.get.mockRejectedValueOnce(axiosFailure(404))
    renderMessages('/dashboard/contact-messages/49')
    expect(
      await screen.findByRole('heading', { name: i18n.t('contactMessages.notFound.title'), level: 1 })
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('link', { name: i18n.t('contactMessages.back') })).toBeInTheDocument()
    expect(screen.queryByTestId('query-state-loading-error')).not.toBeInTheDocument()
    expect(http.get).toHaveBeenCalledTimes(1)
  })
  it('retains generic initial 500 Retry and a meaningful page heading', async () => {
    http.get.mockRejectedValueOnce(axiosFailure(500))
    renderMessages('/dashboard/contact-messages/49')
    await screen.findByTestId('query-state-loading-error')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Contact Message Details')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('button', { name: 'Save Status' })).toBeEnabled()
    expect(http.get).toHaveBeenCalledTimes(2)
  })
  it.each([404, 500])(
    'retains cached content and blocks actions after background %s until Retry succeeds',
    async (status) => {
      const { client } = await loaded()
      http.get.mockRejectedValueOnce(axiosFailure(status))
      await act(async () => {
        await client.refetchQueries(exact)
      })
      expect(await screen.findByTestId('query-state-refetch-error')).toBeInTheDocument()
      expect(screen.getByText(raw.message)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save Status' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Delete contact message 49' })).toBeDisabled()
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
      await waitFor(() => expect(screen.getByRole('button', { name: 'Save Status' })).toBeEnabled())
      expect(screen.getByRole('button', { name: 'Delete contact message 49' })).toBeEnabled()
      expect(http.patch).not.toHaveBeenCalled()
      expect(http.delete).not.toHaveBeenCalled()
    }
  )
  it('disables cached actions while Show is paused and restores them after reconnect', async () => {
    const { client } = await loaded()
    await act(async () => {
      onlineManager.setOnline(false)
      await client.refetchQueries(exact)
    })
    await waitFor(() => expect(client.getQueryState(key)?.fetchStatus).toBe('paused'))
    expect(screen.getByText(raw.message)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Status' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete contact message 49' })).toBeDisabled()
    expect(http.get).toHaveBeenCalledTimes(1)
    await act(async () => {
      onlineManager.setOnline(true)
    })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Status' })).toBeEnabled())
  })
})

describe('Contact Detail mutation freshness and cancellation', () => {
  it.each([404, 500, 'paused'] as const)(
    'blocks an already open delete after %s; Cancel and Escape still work',
    async (state) => {
      const { client } = await loaded()
      for (const close of ['cancel', 'escape']) {
        await userEvent.click(screen.getByRole('button', { name: 'Delete contact message 49' }))
        await act(async () => {
          if (state === 'paused') onlineManager.setOnline(false)
          else http.get.mockRejectedValueOnce(axiosFailure(state))
          await client.refetchQueries(exact)
        })
        await waitFor(() => expect(screen.getByRole('button', { name: 'Confirm Delete' })).toBeDisabled())
        fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }))
        expect(http.delete).not.toHaveBeenCalled()
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
        if (close === 'cancel') await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        else await userEvent.keyboard('{Escape}')
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        await act(async () => {
          if (state === 'paused') onlineManager.setOnline(true)
          else await client.refetchQueries(exact)
        })
        await waitFor(() => expect(screen.getByRole('button', { name: 'Delete contact message 49' })).toBeEnabled())
      }
    }
  )
  it.each(['fetching', 'paused', 'error', 'missing', 'invalidated'] as const)(
    'checks live %s state at status submission even when rendered enabled',
    async (state) => {
      const client = createClient()
      client.setQueryData(key, message)
      render(<ContactMessageStatusForm message={message} disabled={false} />, { wrapper: queryWrapper(client) })
      await selectStatus()
      const query = client.getQueryCache().find(exact)
      if (!query) throw new Error('Missing seeded query')
      if (state === 'missing') client.removeQueries(exact)
      else if (state === 'error') query.setState({ status: 'error', error: new Error('Show failed') })
      else if (state === 'invalidated') await client.invalidateQueries({ ...exact, refetchType: 'none' })
      else query.setState({ fetchStatus: state })
      const save = screen.getByRole('button', { name: 'Save Status' })
      expect(save).toBeEnabled()
      await userEvent.click(save)
      expect(http.patch).not.toHaveBeenCalled()
    }
  )
  it('allows a trustworthy age-stale cache to submit status', async () => {
    const client = createClient()
    client.setQueryData(key, message, { updatedAt: Date.now() - 10 * 60 * 1000 })
    http.patch.mockResolvedValue({ data: { success: true, data: { ...raw, status: 'read', status_label: 'Read' } } })
    render(<ContactMessageStatusForm message={message} disabled={false} />, { wrapper: queryWrapper(client) })
    await selectStatus()
    await userEvent.click(screen.getByRole('button', { name: 'Save Status' }))
    await waitFor(() => expect(http.patch).toHaveBeenCalledTimes(1))
    expect(http.get).not.toHaveBeenCalled()
  })
  it('rechecks Delete at submission before disabled props catch up', async () => {
    const client = createClient()
    client.setQueryData(key, message)
    render(<ContactMessageDeleteDialog target={message} requireDetail onClose={vi.fn()} onDeleted={vi.fn()} />, {
      wrapper: queryWrapper(client),
    })
    const confirm = await screen.findByRole('button', { name: 'Confirm Delete' })
    await client.invalidateQueries({ ...exact, refetchType: 'none' })
    expect(confirm).toBeEnabled()
    await userEvent.click(confirm)
    expect(http.delete).not.toHaveBeenCalled()
  })
  it('cancels an older Show on PATCH success and retains the authoritative response without another GET', async () => {
    const patch = deferred<unknown>()
    const show = deferred<unknown>()
    http.patch.mockReturnValue(patch.promise)
    const { client } = await loaded()
    await selectStatus()
    await userEvent.click(screen.getByRole('button', { name: 'Save Status' }))
    await waitFor(() => expect(http.patch).toHaveBeenCalledTimes(1))
    let signal: AbortSignal | undefined
    http.get.mockImplementationOnce((request: { signal: AbortSignal }) => {
      signal = request.signal
      return show.promise
    })
    let refetch: Promise<void> | undefined
    act(() => {
      refetch = client.refetchQueries(exact)
    })
    expect(signal?.aborted).toBe(false)
    const updated = { ...raw, status: 'read', status_label: 'Read', updated_at: '2026-10-11T12:00:00+00:00' }
    await act(async () => {
      patch.resolve({ data: { success: true, data: updated } })
      await refetch
    })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save Status' })).toBeEnabled())
    expect(signal?.aborted).toBe(true)
    await act(async () => {
      show.resolve(showResponse)
    })
    expect(client.getQueryData(key)).toEqual(normalizeContactMessage(rawContactMessageSchema.parse(updated)))
    expect(http.get).toHaveBeenCalledTimes(2)
  })
  it('cancels a Show started during Delete, removes exact cache, and navigates without late resurrection', async () => {
    const deletion = deferred<unknown>()
    const show = deferred<unknown>()
    http.delete.mockReturnValue(deletion.promise)
    const { client } = await loaded()
    client.setQueryData(['unrelated'], ['keep'])
    await userEvent.click(screen.getByRole('button', { name: 'Delete contact message 49' }))
    const confirm = screen.getByRole('button', { name: 'Confirm Delete' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await waitFor(() => expect(http.delete).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    let signal: AbortSignal | undefined
    http.get.mockImplementationOnce((request: { signal: AbortSignal }) => {
      signal = request.signal
      return show.promise
    })
    let refetch: Promise<void> | undefined
    act(() => {
      refetch = client.refetchQueries(exact)
    })
    expect(signal?.aborted).toBe(false)
    await act(async () => {
      deletion.resolve({ data: { success: true } })
      await refetch
    })
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/dashboard\/contact-messages$/))
    expect(signal?.aborted).toBe(true)
    expect(client.getQueryData(key)).toBeUndefined()
    await act(async () => {
      show.resolve(showResponse)
    })
    expect(client.getQueryData(key)).toBeUndefined()
    expect(client.getQueryData(['unrelated'])).toEqual(['keep'])
    expect(http.get.mock.calls.filter(([request]) => request.url.endsWith('/49'))).toHaveLength(2)
  })
})

describe('Contact Detail layout and locales', () => {
  it.each(['en', 'ar'])(
    'shares loading/loaded sections, unique heading associations and one h1 (%s)',
    async (language) => {
      await i18n.changeLanguage(language)
      const show = deferred<unknown>()
      http.get.mockReturnValueOnce(show.promise)
      const { container } = renderMessages('/dashboard/contact-messages/49')
      const loading = screen.getByTestId('query-loading-state')
      expect(loading).toHaveAttribute('aria-busy', 'true')
      expect(loading.querySelector('button, a, input, select, textarea, [tabindex]')).toBeNull()
      const sectionKeys = ['fields.message', 'contactInformation', 'fields.account', 'fields.status', 'dates']
      const inspect = () => {
        expect(container.querySelectorAll('h1')).toHaveLength(1)
        const sections = Array.from(container.querySelectorAll('section'))
        expect(sections).toHaveLength(5)
        const ids = sections.map((section) => section.getAttribute('aria-labelledby'))
        expect(new Set(ids).size).toBe(5)
        sections.forEach((section, position) => {
          const heading = section.querySelector('h2')
          expect(heading?.id).toBe(ids[position])
          expect(heading).toHaveTextContent(i18n.t(`contactMessages.${sectionKeys[position]}`))
        })
        expect(sections[0].parentElement).toHaveClass('lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]')
        return sections.map((section) => section.querySelector('h2')?.textContent)
      }
      const loadingSections = inspect()
      await act(async () => {
        show.resolve(showResponse)
      })
      await screen.findByRole('button', { name: i18n.t('contactMessages.saveStatus') })
      expect(inspect()).toEqual(loadingSections)
      sectionKeys.forEach((key) =>
        expect(screen.getByRole('region', { name: i18n.t(`contactMessages.${key}`) })).toBeInTheDocument()
      )
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(
        within(screen.getByRole('region', { name: i18n.t('contactMessages.fields.message') })).getByText(raw.message)
      ).toBeInTheDocument()
      expect(document.documentElement.dir).toBe(language === 'ar' ? 'rtl' : 'ltr')
      expect(http.get).toHaveBeenCalledTimes(1)
      expect(http.patch).not.toHaveBeenCalled()
    }
  )
  it('keeps English/Arabic translation keys and interpolations in parity', () => {
    const flatten = (value: object, prefix = ''): [string, string][] =>
      Object.entries(value).flatMap(([key, child]) =>
        typeof child === 'string' ? [[prefix + key, child]] : flatten(child, `${prefix}${key}.`)
      )
    const english = flatten(en)
    const arabic = new Map(flatten(ar))
    expect(english.map(([key]) => key).sort()).toEqual([...arabic.keys()].sort())
    for (const [key, value] of english) {
      expect(arabic.get(key)?.trim()).toBeTruthy()
      expect(arabic.get(key)).toMatch(/[\u0600-\u06ff]/)
      expect(arabic.get(key)?.match(/\{\{[^}]+\}\}/g) ?? []).toEqual(value.match(/\{\{[^}]+\}\}/g) ?? [])
    }
  })
})
