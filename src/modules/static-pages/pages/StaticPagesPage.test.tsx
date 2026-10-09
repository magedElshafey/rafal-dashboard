import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import StaticPagesPage from '@/modules/static-pages/pages/StaticPagesPage'
import type { StaticPage } from '@/modules/static-pages/types/static-page.types'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
Element.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
HTMLElement.prototype.setPointerCapture = vi.fn()
HTMLElement.prototype.releasePointerCapture = vi.fn()

const page = (id: number, overrides: Partial<StaticPage> = {}): StaticPage => ({
  id,
  slug: `page-${id}`,
  title: { ar: `صفحة ${id}`, en: id === 1 ? null : `Page ${id}` },
  content: { ar: 'محتوى', en: null },
  isPublished: id === 1,
  isSystem: id === 1,
  createdAt: '2026-09-28T13:31:50+00:00',
  updatedAt: '2026-09-28T13:31:50+00:00',
  ...overrides,
})

function paginated(items: StaticPage[], current = 1, totalPages = 1): PaginatedData<StaticPage> {
  return {
    items,
    paginate: {
      current_page: current,
      total_pages: totalPages,
      per_page: 15,
      total: totalPages > 1 ? 2 : items.length,
      count: items.length,
      next_page_url: current < totalPages ? String(current + 1) : null,
      prev_page_url: current > 1 ? String(current - 1) : null,
    },
    extra: null,
  }
}

function renderPage(initialEntry = '/dashboard/pages') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <StaticPagesPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { client, view }
}

describe('StaticPagesPage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await i18n.changeLanguage('en')
  })

  it('shows a layout skeleton and then a localized empty state', async () => {
    let resolveList!: (value: PaginatedData<StaticPage>) => void
    vi.spyOn(staticPagesService, 'list').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveList = resolve
        })
    )
    renderPage()

    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    resolveList(paginated([]))
    expect(await screen.findByText('No static pages yet')).toBeInTheDocument()
  })

  it('shows a safe initial error with retry', async () => {
    vi.spyOn(staticPagesService, 'list')
      .mockRejectedValueOnce(new Error('unsafe backend detail'))
      .mockResolvedValueOnce(paginated([]))
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('unsafe backend detail')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('No static pages yet')).toBeInTheDocument()
  })

  it('renders safe desktop/mobile data and exposes only fully resolved Edit actions', async () => {
    vi.spyOn(staticPagesService, 'list').mockResolvedValue(paginated([page(1)]))
    renderPage()

    expect(await screen.findAllByText('صفحة 1')).toHaveLength(2)
    expect(screen.getAllByText('Published').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('System').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('page-1')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Edit صفحة 1' })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    expect(screen.queryByText(/{{|}}/)).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search pages' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByText('محتوى')).not.toBeInTheDocument()
  })

  it('resets pagination for search and Apply, retains filters on next pages, and resets all filters once', async () => {
    const items = Array.from({ length: 16 }, (_, index) => page(index + 1))
    const list = vi
      .spyOn(staticPagesService, 'list')
      .mockImplementation(async (pageNumber) =>
        paginated(items.slice((pageNumber - 1) * 15, pageNumber * 15), pageNumber, 2)
      )
    const user = userEvent.setup()
    renderPage('/dashboard/pages?page=4&search=privacy&is_published=0&sort_by=slug&sort_dir=asc')

    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([pageNumber, , filters]) =>
            pageNumber === 2 &&
            filters?.search === 'privacy' &&
            filters.isPublished === false &&
            filters.sortBy === 'slug' &&
            filters.sortDir === 'asc'
        )
      ).toBe(true)
    )

    const search = screen.getByRole('textbox', { name: 'Search pages' })
    await user.clear(search)
    await user.type(search, 'terms')
    await waitFor(
      () =>
        expect(
          list.mock.calls.some(
            ([pageNumber, , filters]) =>
              pageNumber === 1 &&
              filters?.search === 'terms' &&
              filters.isPublished === false &&
              filters.sortBy === 'slug' &&
              filters.sortDir === 'asc'
          )
        ).toBe(true),
      { timeout: 2000 }
    )
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([pageNumber, , filters]) => pageNumber === 2 && filters?.search === 'terms' && filters.sortBy === 'slug'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const requestCountBeforeDraftChange = list.mock.calls.length
    await user.click(screen.getByRole('combobox', { name: 'Sort direction' }))
    await user.click(await screen.findByRole('option', { name: 'Descending' }))
    expect(list).toHaveBeenCalledTimes(requestCountBeforeDraftChange)
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([pageNumber, , filters]) =>
            pageNumber === 1 &&
            filters?.search === 'terms' &&
            filters.isPublished === false &&
            filters.sortBy === 'slug' &&
            filters.sortDir === 'desc'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const resetRequestCount = list.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([pageNumber, , filters]) =>
            pageNumber === 1 &&
            filters?.search === '' &&
            filters.isPublished === null &&
            filters.sortBy === null &&
            filters.sortDir === null
        )
      ).toBe(true)
    )
    expect(
      list.mock.calls
        .slice(resetRequestCount)
        .filter(
          ([pageNumber, , filters]) =>
            pageNumber === 1 &&
            filters?.search === '' &&
            filters.isPublished === null &&
            filters.sortBy === null &&
            filters.sortDir === null
        )
    ).toHaveLength(1)
    expect(search).toHaveValue('')
  })

  it('preserves loaded rows while retrying a failed next page', async () => {
    let pageTwoAttempts = 0
    vi.spyOn(staticPagesService, 'list').mockImplementation(async (pageNumber) => {
      if (pageNumber === 1) return paginated([page(1)], 1, 2)
      pageTwoAttempts += 1
      if (pageTwoAttempts === 1) throw new Error('unsafe next-page detail')
      return paginated([page(2)], 2, 2)
    })
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findAllByText('صفحة 1')).toHaveLength(2)
    const notices = await screen.findAllByTestId('query-state-refetch-error')
    expect(screen.getAllByText('صفحة 1')).toHaveLength(2)
    expect(screen.queryByText('unsafe next-page detail')).not.toBeInTheDocument()
    await user.click(within(notices.at(-1)!).getByRole('button', { name: /try again/i }))
    expect(await screen.findAllByText('Page 2')).toHaveLength(2)
    expect(pageTwoAttempts).toBe(2)
  })
})
