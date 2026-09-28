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

const initialPage: StaticPage = {
  id: 7,
  slug: 'Legacy Slug',
  title: { ar: 'سياسة', en: null },
  content: { ar: 'محتوى', en: null },
  isPublished: true,
  isSystem: false,
  createdAt: '2026-09-28T13:31:50+00:00',
  updatedAt: '2026-09-28T13:31:50+00:00',
}

function mergeUpdate(payload: StaticPageUpdatePayload): StaticPage {
  return {
    ...initialPage,
    slug: payload.slug ?? initialPage.slug,
    title: { ...initialPage.title, ...payload.title },
    content: { ...initialPage.content, ...payload.content },
    isPublished: payload.isPublished ?? initialPage.isPublished,
    isSystem: payload.isSystem ?? initialPage.isSystem,
    updatedAt: '2026-09-29T00:00:00+00:00',
  }
}

function queryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
}

function renderEdit() {
  const client = queryClient()
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard/pages/7/edit']}>
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
    expect(screen.getByRole('textbox', { name: 'English content' })).toHaveValue('')
    expect(screen.getByRole('switch', { name: 'Publish this page' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'System page' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(show).toHaveBeenCalledWith(7, expect.any(AbortSignal))
    expect(list).not.toHaveBeenCalled()
  })

  it('creates with AR/EN values, blur-normalized slug, and narrow list invalidation', async () => {
    const created = { ...initialPage, slug: 'privacy-policy', title: { ar: 'سياسة', en: 'Privacy' } }
    const create = vi.spyOn(staticPagesService, 'create').mockResolvedValue(created)
    const user = userEvent.setup()
    const client = renderCreate()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const slug = screen.getByRole('textbox', { name: 'Slug' })

    await user.type(slug, ' Privacy / Policy? ')
    await user.tab()
    expect(slug).toHaveValue('privacy-policy')
    await user.type(screen.getByRole('textbox', { name: 'Arabic title' }), 'سياسة')
    await user.type(screen.getByRole('textbox', { name: 'English title' }), 'Privacy')
    await user.type(screen.getByRole('textbox', { name: 'Arabic content' }), 'محتوى')
    await user.type(screen.getByRole('textbox', { name: 'English content' }), 'Content')
    await user.click(screen.getByRole('switch', { name: 'Publish this page' }))
    await user.click(screen.getByRole('switch', { name: 'System page' }))
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Static Pages Index destination')).toBeInTheDocument()
    expect(create).toHaveBeenCalledWith({
      slug: 'privacy-policy',
      title: { ar: 'سياسة', en: 'Privacy' },
      content: { ar: 'محتوى', en: 'Content' },
      isPublished: true,
      isSystem: true,
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: staticPagesKeys.lists() })
    expect(toastMocks.success).toHaveBeenCalledWith('Static page created.')
  })

  it('submits only dirty fields, including writable isSystem, then resets to authoritative data', async () => {
    vi.spyOn(staticPagesService, 'show').mockResolvedValue(structuredClone(initialPage))
    const update = vi.spyOn(staticPagesService, 'update').mockImplementation(async (_id, payload) => ({
      ...mergeUpdate(payload),
      title: { ...initialPage.title, en: 'Authoritative title' },
    }))
    const user = userEvent.setup()
    const client = renderEdit()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const englishTitle = await screen.findByRole('textbox', { name: 'English title' })

    await user.type(englishTitle, 'Typed title')
    await user.click(screen.getByRole('switch', { name: 'System page' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(englishTitle).toHaveValue('Authoritative title'))
    expect(update).toHaveBeenCalledWith(7, { title: { en: 'Typed title' }, isSystem: true })
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(client.getQueryData(staticPagesKeys.detail(7))).toMatchObject({
      title: { en: 'Authoritative title' },
      isSystem: true,
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: staticPagesKeys.lists() })
  })

  it('maps backend slug validation and preserves the edited value after failure', async () => {
    vi.spyOn(staticPagesService, 'show').mockResolvedValue(structuredClone(initialPage))
    vi.spyOn(staticPagesService, 'update').mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { errors: { slug: ['This slug is already in use.'] } } },
    })
    const user = userEvent.setup()
    renderEdit()
    const slug = await screen.findByRole('textbox', { name: 'Slug' })

    await user.clear(slug)
    await user.type(slug, ' Existing / Page ')
    await user.tab()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('This slug is already in use.')).toBeInTheDocument()
    expect(slug).toHaveValue('existing-page')
    expect(slug).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText(/isAxiosError|errors/)).not.toBeInTheDocument()
  })

  it('protects Update from duplicate submission and omits an untouched legacy slug', async () => {
    vi.spyOn(staticPagesService, 'show').mockResolvedValue(structuredClone(initialPage))
    let resolveUpdate!: (page: StaticPage) => void
    const update = vi.spyOn(staticPagesService, 'update').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
    )
    const user = userEvent.setup()
    renderEdit()
    const content = await screen.findByRole('textbox', { name: 'English content' })
    await user.type(content, 'New content')

    await user.dblClick(screen.getByRole('button', { name: 'Save changes' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith(7, { content: { en: 'New content' } }))
    expect(update).toHaveBeenCalledTimes(1)
    await act(async () => resolveUpdate({ ...initialPage, content: { ...initialPage.content, en: 'New content' } }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled())
  })
})
