import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import StaticPageCreatePage from '@/modules/static-pages/pages/StaticPageCreatePage'
import StaticPageEditPage from '@/modules/static-pages/pages/StaticPageEditPage'
import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'
import type { StaticPage, StaticPageUpdatePayload } from '@/modules/static-pages/types/static-page.types'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock)
document.elementFromPoint = () => document.activeElement
Range.prototype.getClientRects = () => [] as unknown as DOMRectList
Range.prototype.getBoundingClientRect = () => new DOMRect()

const initialPage: StaticPage = {
  id: 7,
  slug: 'Legacy Slug',
  title: { ar: 'سياسة', en: null },
  content: { ar: '<p>محتوى</p>', en: null },
  isPublished: true,
  isSystem: false,
  createdAt: '2026-09-28T13:31:50+00:00',
  updatedAt: '2026-09-28T13:31:50+00:00',
}

function mergeUpdate(payload: StaticPageUpdatePayload): StaticPage {
  return {
    ...initialPage,
    slug: payload.slug,
    title: payload.title,
    content: payload.content,
    isPublished: payload.isPublished,
    updatedAt: '2026-09-29T00:00:00+00:00',
  }
}

function queryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
}

function renderEdit(entry = '/dashboard/pages/7/edit') {
  const client = queryClient()
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/dashboard/pages/:id/edit" element={<StaticPageEditPage />} />
          <Route path="/dashboard/pages" element={<p>Static Pages Index</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return client
}

function renderCreate() {
  const client = queryClient()
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard/pages/new']}>
        <Routes>
          <Route path="/dashboard/pages/new" element={<StaticPageCreatePage />} />
          <Route path="/dashboard/pages" element={<p>Static Pages Index destination</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return client
}

describe('Static Page forms', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('loads Edit from authoritative Show and safely initializes a missing locale', async () => {
    const show = vi.spyOn(staticPagesService, 'show').mockResolvedValue(structuredClone(initialPage))
    const list = vi.spyOn(staticPagesService, 'list')
    renderEdit()

    expect(screen.getByTestId('static-page-form-skeleton')).toBeInTheDocument()
    expect(await screen.findByRole('textbox', { name: 'Slug' })).toHaveValue('Legacy Slug')
    expect(screen.getByRole('textbox', { name: 'Arabic title' })).toHaveValue('سياسة')
    expect(screen.getByRole('textbox', { name: 'English title' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Arabic content' })).toHaveTextContent('محتوى')
    expect(screen.getByRole('textbox', { name: 'Arabic content' })).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('textbox', { name: 'English content' })).toHaveTextContent('')
    expect(screen.getByRole('textbox', { name: 'English content' })).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('switch', { name: 'Publish this page' })).toBeChecked()
    expect(screen.queryByRole('switch', { name: 'System page' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(show).toHaveBeenCalledWith(7, expect.any(AbortSignal))
    expect(list).not.toHaveBeenCalled()
  })

  it('creates with AR/EN values, blur-normalized slug, and narrow list invalidation', async () => {
    const created = { ...initialPage, slug: 'privacy-policy', title: { ar: 'سياسة', en: 'Privacy' } }
    const create = vi.spyOn(staticPagesService, 'create').mockResolvedValue(created)
    const user = userEvent.setup({ delay: 5 })
    const client = renderCreate()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const slug = screen.getByRole('textbox', { name: 'Slug' })

    await user.type(slug, ' Privacy / Policy? ')
    await user.tab()
    expect(slug).toHaveValue('privacy-policy')
    await user.type(screen.getByRole('textbox', { name: 'Arabic title' }), 'سياسة')
    await user.type(screen.getByRole('textbox', { name: 'English title' }), 'Privacy')
    await user.click(screen.getByRole('textbox', { name: 'Arabic content' }))
    await user.paste('محتوى')
    await user.click(screen.getByRole('textbox', { name: 'English content' }))
    await user.paste('Content')
    await user.click(screen.getByRole('switch', { name: 'Publish this page' }))
    expect(screen.queryByRole('switch', { name: 'System page' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Static Pages Index destination')).toBeInTheDocument()
    expect(create).toHaveBeenCalledWith({
      slug: 'privacy-policy',
      title: { ar: 'سياسة', en: 'Privacy' },
      content: { ar: '<p>محتوى</p>', en: '<p>Content</p>' },
      isPublished: true,
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: staticPagesKeys.lists() })
    expect(toastMocks.success).toHaveBeenCalledWith('Static page created.')
  })

  it('submits the full writable body and resets to authoritative data', async () => {
    vi.spyOn(staticPagesService, 'show').mockResolvedValue(structuredClone(initialPage))
    const update = vi.spyOn(staticPagesService, 'update').mockImplementation(async (_id, payload) => ({
      ...mergeUpdate(payload),
      title: { ...initialPage.title, en: 'Authoritative title' },
    }))
    const user = userEvent.setup({ delay: 5 })
    const client = renderEdit()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const englishTitle = await screen.findByRole('textbox', { name: 'English title' })

    await user.type(englishTitle, 'Typed title')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(englishTitle).toHaveValue('Authoritative title'))
    expect(update).toHaveBeenCalledWith(7, {
      slug: 'Legacy Slug',
      title: { ar: 'سياسة', en: 'Typed title' },
      content: { ar: '<p>محتوى</p>', en: '' },
      isPublished: true,
    })
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(client.getQueryData(staticPagesKeys.detail(7))).toMatchObject({
      title: { en: 'Authoritative title' },
      isSystem: false,
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: staticPagesKeys.lists() })
  })

  it('maps backend slug validation and preserves the edited value after failure', async () => {
    vi.spyOn(staticPagesService, 'show').mockResolvedValue(structuredClone(initialPage))
    const update = vi.spyOn(staticPagesService, 'update').mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { errors: { slug: ['This slug is already in use.'] } } },
    })
    const user = userEvent.setup({ delay: 5 })
    renderEdit()
    const slug = await screen.findByRole('textbox', { name: 'Slug' })

    await user.clear(slug)
    await user.type(slug, ' Existing / Page ')
    await user.tab()
    const englishContent = screen.getByRole('textbox', { name: 'English content' })
    await user.click(englishContent)
    await user.paste('Draft content')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('This slug is already in use.')).toBeInTheDocument()
    expect(slug).toHaveValue('existing-page')
    expect(slug).toHaveAttribute('aria-invalid', 'true')
    expect(englishContent).toHaveTextContent('Draft content')
    expect(update).toHaveBeenCalledWith(7, {
      slug: 'existing-page',
      title: { ar: 'سياسة', en: '' },
      content: { ar: '<p>محتوى</p>', en: '<p>Draft content</p>' },
      isPublished: true,
    })
    expect(screen.queryByText(/isAxiosError|errors/)).not.toBeInTheDocument()
  })

  it('protects Update from duplicate submission and preserves an untouched legacy slug', async () => {
    vi.spyOn(staticPagesService, 'show').mockResolvedValue(structuredClone(initialPage))
    let resolveUpdate!: (page: StaticPage) => void
    const update = vi.spyOn(staticPagesService, 'update').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
    )
    const user = userEvent.setup({ delay: 5 })
    renderEdit()
    const content = await screen.findByRole('textbox', { name: 'English content' })
    await user.click(content)
    await user.paste('New content')

    await user.dblClick(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(7, {
        slug: 'Legacy Slug',
        title: { ar: 'سياسة', en: '' },
        content: { ar: '<p>محتوى</p>', en: '<p>New content</p>' },
        isPublished: true,
      })
    )
    expect(update).toHaveBeenCalledTimes(1)
    await act(async () =>
      resolveUpdate({ ...initialPage, content: { ...initialPage.content, en: '<p>New content</p>' } })
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled())
  })

  it.each(['/dashboard/pages/abc/edit', '/dashboard/pages/0/edit', '/dashboard/pages/-1/edit'])(
    'renders a localized invalid state without Show or Retry for %s',
    async (entry) => {
      const show = vi.spyOn(staticPagesService, 'show')
      const user = userEvent.setup({ delay: 5 })
      renderEdit(entry)

      expect(await screen.findByText('Invalid static page')).toBeInTheDocument()
      expect(screen.getByText('This edit link does not contain a valid static page ID.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()
      expect(show).not.toHaveBeenCalled()
      await user.click(screen.getByRole('link', { name: 'Back to Static Pages' }))
      expect(await screen.findByText('Static Pages Index')).toBeInTheDocument()
    }
  )
})
