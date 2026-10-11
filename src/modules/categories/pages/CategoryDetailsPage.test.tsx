import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'
import { categoriesService } from '@/modules/categories/api/categories.service'
import { normalizeCategory } from '@/modules/categories/api/category.mapper'
import CategoryDetailsPage from '@/modules/categories/pages/CategoryDetailsPage'
import { categoriesKeys } from '@/modules/categories/queries/categories.keys'
import type { RawCategory } from '@/modules/categories/types/category.types'
import en from '@/modules/categories/locale/en.json'
import ar from '@/modules/categories/locale/ar.json'
import { formatDateTime } from '@/utils/date/date.helpers'

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))

const category: RawCategory = {
  id: 7,
  parent_id: 2,
  name: { ar: 'خواتم', en: 'Rings' },
  slug: 'rings',
  description: { ar: 'وصف الخواتم', en: '<h1>Plain text</h1><script>alert(1)</script>' },
  is_active: true,
  sort_order: '3',
  children_count: '2',
  image_url: 'https://example.test/rings.jpg',
  created_at: '2026-09-06T20:01:03+00:00',
  updated_at: '2026-09-07T20:01:03+00:00',
}
const response = (data = category) => ({ success: true, message: 'ok', data })
const reply = (data = category) => ({ data: response(data) })

function renderPage(id = '7', client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })) {
  const result = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/dashboard/categories/${id}`]}>
        <Routes>
          <Route path="/dashboard/categories/:id" element={<CategoryDetailsPage />} />
          <Route path="/dashboard/categories/:id/edit" element={<p>Edit destination</p>} />
          <Route path="/dashboard/categories" element={<p>Categories destination</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...result, client }
}

describe('Category details', () => {
  beforeEach(async () => {
    http.get.mockReset().mockResolvedValue(reply())
    await i18n.changeLanguage('en')
  })
  afterEach(() => vi.restoreAllMocks())

  it('uses one canonical Show request, its Edit cache key and signal, with no lookup requests', async () => {
    const show = vi.spyOn(categoriesService, 'show')
    const { client } = renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Rings' })).toBeInTheDocument()
    expect(show).toHaveBeenCalledExactlyOnceWith(7, expect.any(AbortSignal))
    expect(http.get).toHaveBeenCalledExactlyOnceWith({
      url: '/dashboard/categories/7',
      signal: expect.any(AbortSignal),
      suppressErrorNotification: true,
    })
    expect(
      client
        .getQueryCache()
        .getAll()
        .map((query) => query.queryKey)
    ).toEqual([categoriesKeys.detail(7)])
    expect(client.getQueryData(categoriesKeys.detail(7))).toEqual(response(normalizeCategory(category)))
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('rings')).toBeInTheDocument()
    expect(screen.getByText(formatDateTime(category.created_at, { locale: 'en' }))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Parent category #2' })).toHaveAttribute('href', '/dashboard/categories/2')
    expect(screen.getByRole('img', { name: 'Rings' })).toHaveAttribute('src', category.image_url)
    expect(screen.getByRole('link', { name: 'Edit Rings' })).toHaveAttribute('href', '/dashboard/categories/7/edit')
    expect(screen.getByRole('link', { name: 'Back to Categories' })).toHaveAttribute('href', '/dashboard/categories')
    expect(
      screen.getByText(category.description && !Array.isArray(category.description) ? category.description.en : '')
    ).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const sections = screen.getAllByRole('region')
    expect(sections.map((section) => within(section).getByRole('heading', { level: 2 }).textContent)).toEqual([
      'Overview',
      'Image',
      'Description',
      'Hierarchy',
      'Dates',
    ])
    const ids = sections.map((section) => section.getAttribute('aria-labelledby'))
    expect(new Set(ids).size).toBe(ids.length)
    expect(document.querySelectorAll('dl')).toHaveLength(3)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('supports keyboard access to Back and Edit navigation', async () => {
    const user = userEvent.setup()
    renderPage()
    const back = await screen.findByRole('link', { name: 'Back to Categories' })
    await user.tab()
    expect(back).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('link', { name: 'Edit Rings' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Edit destination')).toBeInTheDocument()
  })

  it.each(['0', '-2', 'abc', '1.5', '1e2', '9007199254740992'])(
    'rejects invalid ID %s without creating any query',
    (id) => {
      const { client } = renderPage(id)
      expect(screen.getByRole('heading', { name: 'Category not found' })).toBeInTheDocument()
      expect(http.get).not.toHaveBeenCalled()
      expect(client.getQueryCache().getAll()).toHaveLength(0)
    }
  )

  it('renders cached Show data immediately and allows only the existing stale-on-mount refetch', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    client.setQueryData(categoriesKeys.detail(7), response(normalizeCategory(category)))
    http.get.mockImplementation(() => new Promise(() => {}))
    renderPage('7', client)
    expect(screen.getByRole('heading', { level: 1, name: 'Rings' })).toBeInTheDocument()
    expect(screen.queryByTestId('query-loading-state')).not.toBeInTheDocument()
    await waitFor(() => expect(http.get).toHaveBeenCalledTimes(1))
  })

  it('aborts the in-flight Show request when leaving the page', () => {
    http.get.mockImplementation(() => new Promise(() => {}))
    const { unmount } = renderPage()
    const signal: AbortSignal = http.get.mock.calls[0][0].signal
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
  })

  it('mirrors section/card/grid, metadata, header/actions and media structure while loading', async () => {
    let resolve!: (value: ReturnType<typeof reply>) => void
    http.get.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const { container } = renderPage()
    const structure = () =>
      Array.from(container.querySelectorAll('section')).map((section) => ({
        title: section.querySelector('h2')?.textContent,
        section: section.className,
        card: section.firstElementChild?.className,
        grid: section.parentElement?.className,
        labels: Array.from(section.querySelectorAll('dt')).map((term) => term.textContent),
      }))
    const loading = structure()
    const headerClass = container.querySelector('header')?.className
    const mediaFrame = container.querySelectorAll('section')[1].querySelector('h2')?.nextElementSibling?.className
    expect(screen.getByTestId('query-loading-state')).toHaveAttribute('aria-busy', 'true')
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(10)
    expect(container.querySelectorAll('header [data-slot="skeleton"]')).toHaveLength(2)
    expect(container.querySelector('a,button,input')).toBeNull()
    await act(async () => resolve(reply()))
    await screen.findByRole('heading', { name: 'Rings', level: 1 })
    expect(structure()).toEqual(loading)
    expect(container.querySelector('header')?.className).toBe(headerClass)
    expect(container.querySelectorAll('section')[1].querySelector('h2')?.nextElementSibling?.className).toBe(mediaFrame)
    expect(container.querySelectorAll('header a')).toHaveLength(2)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull()
  })

  it('keeps optional empty fields as section fallbacks and supplies a localized missing name', async () => {
    http.get.mockResolvedValue(
      reply({
        ...category,
        parent_id: null,
        name: { ar: '', en: '' },
        description: [],
        image_url: null,
        slug: '',
        is_active: false,
        created_at: '',
        updated_at: 'invalid',
      })
    )
    renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Category details' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'No image' })).toBeInTheDocument()
    expect(screen.getByText('Root Category')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Description' })).getByText('—')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Dates' })).getAllByText('—')).toHaveLength(2)
    expect(screen.queryByText(/^(null|undefined)$/)).not.toBeInTheDocument()
    expect(screen.queryByText('Category not found')).not.toBeInTheDocument()
  })

  it('uses the existing broken-image fallback', async () => {
    renderPage()
    fireEvent.error(await screen.findByRole('img', { name: 'Rings' }))
    expect(screen.getByRole('img', { name: 'No image' })).toBeInTheDocument()
  })

  it('renders initial HTTP 404 as not found with a working Back action', async () => {
    http.get.mockRejectedValue({ isAxiosError: true, response: { status: 404 } })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Category not found' })).toBeInTheDocument()
    expect(screen.queryByTestId('query-state-loading-error')).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('link', { name: 'Back to Categories' }))
    expect(screen.getByText('Categories destination')).toBeInTheDocument()
  })

  it('provides safe initial error feedback and retries successfully', async () => {
    http.get.mockRejectedValueOnce(new Error('private request details'))
    renderPage()
    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('private request details')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Categories' })).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Rings' })).toBeInTheDocument()
    expect(http.get).toHaveBeenCalledTimes(2)
  })

  it.each([500, 404])('preserves details after a background %s and allows retry', async (status) => {
    const { client } = renderPage()
    await screen.findByRole('heading', { level: 1, name: 'Rings' })
    http.get.mockRejectedValueOnce({ isAxiosError: true, response: { status } })
    await act(async () => {
      await client.invalidateQueries({ queryKey: categoriesKeys.detail(7) })
    })
    expect(await screen.findByTestId('query-state-refetch-error')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Rings' })).toBeInTheDocument()
    expect(screen.queryByText('Category not found')).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() => expect(screen.queryByTestId('query-state-refetch-error')).not.toBeInTheDocument())
    expect(http.get).toHaveBeenCalledTimes(3)
  })

  it('renders Arabic names, description, actions, numbers and dates in RTL', async () => {
    await i18n.changeLanguage('ar')
    renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'خواتم' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(screen.getByText('وصف الخواتم')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'تعديل خواتم' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: ar.categories.details.back })).toBeInTheDocument()
    expect(screen.getByText(new Intl.NumberFormat('ar').format(3))).toBeInTheDocument()
    expect(screen.getByText(formatDateTime(category.created_at, { locale: 'ar' }))).toBeInTheDocument()
  })

  it('keeps detail and action translation keys aligned', () => {
    expect(Object.keys(ar.categories.details).sort()).toEqual(Object.keys(en.categories.details).sort())
    expect(Object.keys(ar.categories.details.notFound).sort()).toEqual(
      Object.keys(en.categories.details.notFound).sort()
    )
    expect(Object.keys(ar.categories.actions).sort()).toEqual(Object.keys(en.categories.actions).sort())
  })
})
