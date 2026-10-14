import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import BlogCategoriesPage from '@/modules/blogs/pages/BlogCategoriesPage'
import { blogCategoriesKeys } from '@/modules/blogs/queries/blog-categories.keys'
import { readBlogCategoriesFilters } from '@/modules/blogs/utils/blog-category-filters'
import BlogPostsPage from '@/modules/blogs/pages/BlogPostsPage'
import { blogPostsKeys } from '@/modules/blogs/queries/blog-posts.keys'
import { readBlogPostsFilters } from '@/modules/blogs/utils/blog-post-filters'
import categories from '@/modules/blogs/__tests__/blog-categories.fixture.json'
import posts from '@/modules/blogs/__tests__/blog-posts.fixture.json'
import { deferred, renderBlogs, setupBlogs } from '@/modules/blogs/__tests__/blogs-test-utils'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
beforeEach(async () => {
  vi.clearAllMocks()
  await setupBlogs()
  http.get.mockImplementation(async ({ url }) => ({ data: url === '/dashboard/blog-categories' ? categories : posts }))
})
afterEach(() => vi.unstubAllGlobals())
describe('blog index experiences', () => {
  it.each(['en', 'ar'])(
    'renders categories and Arabic articles with %s UI from one list request each',
    async (language) => {
      await i18n.changeLanguage(language)
      const first = renderBlogs(<BlogCategoriesPage />)
      await screen.findAllByText(language === 'ar' ? 'التخصيص' : 'Personalization')
      expect(first.container.querySelectorAll('h1')).toHaveLength(1)
      expect(http.get).toHaveBeenCalledTimes(1)
      first.unmount()
      const second = renderBlogs(<BlogPostsPage />)
      await screen.findAllByText(posts.data[0].title.ar)
      expect(second.container.querySelectorAll('h1')).toHaveLength(1)
      expect(second.container.querySelector('img')).toHaveAttribute('src', posts.data[0].cover_url)
      expect(second.container.querySelectorAll('[data-slot="responsive-data-mobile-cards"]')).toHaveLength(1)
      expect(http.get.mock.calls.map(([request]) => request.url)).toEqual([
        '/dashboard/blog-categories',
        '/dashboard/blog-posts',
      ])
      expect(screen.queryByRole('button', { name: /Delete post|Edit post|Publish post/ })).not.toBeInTheDocument()
    }
  )
  it.each(['categories', 'posts'])('shows structural loading, empty data and safe Retry for %s', async (kind) => {
    const pending = deferred<unknown>()
    http.get.mockReturnValueOnce(pending.promise)
    const fixture = kind === 'categories' ? categories : posts
    const { container } = renderBlogs(kind === 'categories' ? <BlogCategoriesPage /> : <BlogPostsPage />)
    expect(screen.getByText('Loading content...')).toBeInTheDocument()
    expect(container.querySelectorAll('[aria-hidden="true"] [data-slot="responsive-data-desktop"]')).toHaveLength(1)
    expect(container.querySelectorAll('[aria-hidden="true"] [data-slot="responsive-data-mobile-cards"]')).toHaveLength(
      1
    )
    await act(async () => pending.reject(new Error('database details')))
    expect(await screen.findByText('Unable to load content')).toBeInTheDocument()
    expect(screen.queryByText('database details')).not.toBeInTheDocument()
    http.get.mockResolvedValueOnce({ data: { ...fixture, data: [], meta: { ...fixture.meta, total: 0 } } })
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(kind === 'categories' ? 'No blog categories' : 'No blog posts')).toBeInTheDocument()
  })

  it.each(['categories', 'posts'])(
    'blocks pagination during refetch, retains cached %s after failure, then recovers',
    async (kind) => {
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
      const fixture = kind === 'categories' ? categories : posts
      http.get.mockResolvedValueOnce({ data: { ...fixture, meta: { ...fixture.meta, last_page: 2 } } })
      const { client } = renderBlogs(kind === 'categories' ? <BlogCategoriesPage /> : <BlogPostsPage />)
      const text = kind === 'categories' ? 'Personalization' : posts.data[0].title.ar
      await screen.findAllByText(text)
      const refresh = deferred<unknown>()
      http.get.mockReturnValueOnce(refresh.promise)
      let refetch!: Promise<void>
      act(() => {
        refetch = client.invalidateQueries({
          queryKey: kind === 'categories' ? blogCategoriesKeys.lists() : blogPostsKeys.lists(),
        })
      })
      await waitFor(() => expect(http.get).toHaveBeenCalledTimes(2))
      await act(async () => intersect())
      expect(http.get).toHaveBeenCalledTimes(2)
      await act(async () => {
        refresh.reject(new Error('internal'))
        await refetch
      })
      expect(await screen.findByText('Unable to refresh data')).toBeInTheDocument()
      expect(screen.getAllByText(text)).toHaveLength(2)
      await act(async () => intersect())
      expect(http.get).toHaveBeenCalledTimes(2)
      http.get.mockResolvedValueOnce({
        data: { ...fixture, data: [fixture.data[1]], meta: { ...fixture.meta, total: 1 } },
      })
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
      await waitFor(() => expect(screen.queryByText('Unable to refresh data')).not.toBeInTheDocument())
      expect(screen.queryByText(text)).not.toBeInTheDocument()
      expect(http.get.mock.calls.map(([r]) => r.query.page)).toEqual([1, 1, 1])
      if (kind === 'categories')
        expect(screen.getAllByRole('button', { name: 'Delete category Gift Guides' })[0]).toBeEnabled()
    }
  )
  it('keeps an empty cached result visible with a background-error notice', async () => {
    http.get.mockResolvedValueOnce({ data: { ...posts, data: [], meta: { ...posts.meta, total: 0 } } })
    const { client } = renderBlogs(<BlogPostsPage />)
    await screen.findByText('No blog posts')
    http.get.mockRejectedValueOnce(new Error('internal'))
    await act(async () => {
      await client.invalidateQueries({ queryKey: blogPostsKeys.lists() })
    })
    expect(await screen.findByText('Unable to refresh data')).toBeInTheDocument()
    expect(screen.getByText('No blog posts')).toBeInTheDocument()
  })
  it('uses every post filter from the URL with no category lookup, then resets', async () => {
    const search =
      '?search=gift&blog_category_id=11&is_published=0&is_featured=1&published_from=2026-09-01&published_to=2026-09-30&sort_by=title&sort_dir=asc&page=4'
    http.get.mockResolvedValueOnce({ data: { ...posts, data: [] } })
    renderBlogs(<BlogPostsPage />, search)
    await screen.findByText('No matching posts')
    expect(http.get).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        query: {
          search: 'gift',
          blog_category_id: 11,
          is_published: 0,
          is_featured: 1,
          published_from: '2026-09-01',
          published_to: '2026-09-30',
          sort_by: 'title',
          sort_dir: 'asc',
          page: 1,
        },
      })
    )
    await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(''))
    await screen.findAllByText(posts.data[0].title.ar)
    expect(http.get.mock.calls.at(-1)?.[0].query).toEqual({ page: 1 })
  })
  it('debounces search and resets URL pagination for categories', async () => {
    renderBlogs(<BlogCategoriesPage />, '?page=4&sort_by=name&sort_dir=desc')
    await screen.findAllByText('Personalization')
    await userEvent.type(screen.getByRole('textbox', { name: 'Search blog categories' }), 'gifts')
    await waitFor(() =>
      expect(http.get.mock.calls.at(-1)?.[0].query).toEqual({
        page: 1,
        search: 'gifts',
        sort_by: 'name',
        sort_dir: 'desc',
      })
    )
    expect(screen.getByTestId('location')).not.toHaveTextContent('page=')
  })
  it('blocks malformed publication dates before any request and offers reset', async () => {
    renderBlogs(<BlogPostsPage />, '?published_from=2026-02-30')
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter valid publication dates')
    expect(http.get).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    await screen.findAllByText(posts.data[0].title.ar)
  })
  it('does not fetch category options until the filter is opened', async () => {
    renderBlogs(<BlogPostsPage />)
    await screen.findAllByText(posts.data[0].title.ar)
    await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
    expect(http.get).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('combobox', { name: 'Category' }))
    await screen.findByRole('option', { name: 'Gift Guides' })
    expect(http.get.mock.calls.map(([request]) => request.url)).toEqual([
      '/dashboard/blog-posts',
      '/dashboard/blog-categories',
    ])
  })
  it('handles no publication date and long untrusted titles as text', async () => {
    const text = '<script>alert(1)</script>' + 'عنوان'.repeat(200)
    http.get.mockResolvedValueOnce({
      data: { ...posts, data: [{ ...posts.data[1], title: { ar: text }, cover_url: '' }] },
    })
    const { container } = renderBlogs(<BlogPostsPage />)
    await screen.findAllByText(text)
    expect(screen.getAllByText('No publication date')).toHaveLength(2)
    expect(screen.getAllByText('No cover')).toHaveLength(2)
    expect(container.querySelector('script')).toBeNull()
    expect(screen.getAllByTitle(text)[0]).toHaveClass('break-words', 'whitespace-normal')
  })
  it('distinguishes permission errors without redirecting', async () => {
    http.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403 } })
    renderBlogs(<BlogPostsPage />)
    expect(await screen.findByText('You do not have permission to access this data.')).toBeInTheDocument()
    expect(http.get.mock.calls[0][0].suppressForbiddenRedirect).toBe(true)
  })
  it('confirms deletion, blocks duplicate requests and retains coherent metadata and blocks stale actions if refresh fails', async () => {
    const deletion = deferred<unknown>()
    http.delete.mockReturnValue(deletion.promise)
    const { client } = renderBlogs(<BlogCategoriesPage />)
    await screen.findAllByText('Personalization')
    client.setQueryData(['unrelated'], { keep: true })
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete category Personalization' })[0])
    expect(http.delete).not.toHaveBeenCalled()
    const confirm = within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete category' })
    fireEvent.click(confirm)
    fireEvent.click(confirm)
    await waitFor(() => expect(http.delete).toHaveBeenCalledTimes(1))
    expect(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    http.get.mockRejectedValueOnce(new Error('refresh failed'))
    await act(async () => deletion.resolve({ data: { success: true, message: 'deleted' } }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getAllByText('Personalization')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Delete category Personalization' })[0]).toBeDisabled()
    expect(await screen.findByText('Unable to refresh data')).toBeInTheDocument()
    expect(client.getQueryData(['unrelated'])).toEqual({ keep: true })
    const data = client.getQueryData<{ pages: { items: { id: number }[] }[] }>(
      blogCategoriesKeys.list(readBlogCategoriesFilters(null))
    )
    expect(data?.pages[0].items.map((item) => item.id)).toEqual([10, 11])
    expect(data?.pages[0]).toMatchObject({ paginate: { total: 5, count: 2 } })
  })
  it('keeps failed deletion open and supports cancellation without another request', async () => {
    http.delete.mockRejectedValue(new Error('internal'))
    renderBlogs(<BlogCategoriesPage />)
    await userEvent.click((await screen.findAllByRole('button', { name: 'Delete category Personalization' }))[0])
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete category' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the category')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(http.delete).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })
  it('loads server pages once, retains rows on next-page failure, retries, then stops', async () => {
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
      .mockResolvedValueOnce({ data: { ...posts, data: [posts.data[0]], meta: { ...posts.meta, last_page: 2 } } })
      .mockRejectedValueOnce(new Error('next'))
      .mockResolvedValueOnce({
        data: { ...posts, data: [posts.data[1]], meta: { ...posts.meta, current_page: 2, last_page: 2 } },
      })
    const { client } = renderBlogs(<BlogPostsPage />)
    await screen.findAllByText(posts.data[0].title.ar)
    await act(async () => {
      intersect()
      intersect()
    })
    expect(await screen.findByText('Unable to refresh data')).toBeInTheDocument()
    expect(screen.getAllByText(posts.data[0].title.ar)).toHaveLength(2)
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findAllByText(posts.data[1].title.ar)
    await act(async () => intersect())
    expect(http.get.mock.calls.map(([request]) => request.query.page)).toEqual([1, 2, 2])
    expect(client.getQueryData(blogPostsKeys.list(readBlogPostsFilters(null)))).toBeDefined()
  })
})

it('keeps an unloaded category ID selected and offers retry inside the open selector', async () => {
  http.get.mockImplementation(async ({ url }) => {
    if (url === '/dashboard/blog-categories') throw new Error('offline')
    return { data: posts }
  })
  renderBlogs(<BlogPostsPage />, '?blog_category_id=99')
  await screen.findAllByText(posts.data[0].title.ar)
  await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
  const select = screen.getByRole('combobox', { name: 'Category' })
  expect(select).toHaveTextContent('Category #99')
  expect(http.get).toHaveBeenCalledTimes(1)
  await userEvent.click(select)
  const retry = await screen.findByRole('button', { name: 'Retry categories' })
  expect(screen.getByRole('option', { name: 'Category #99' })).toBeInTheDocument()
  http.get.mockResolvedValueOnce({ data: categories })
  await userEvent.click(retry)
  expect(await screen.findByRole('option', { name: 'Gift Guides' })).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Category #99' })).toBeInTheDocument()
  expect(http.get.mock.calls.filter(([r]) => r.url === '/dashboard/blog-categories')).toHaveLength(2)
})
it('paginates category options once per request and retries a failed next page', async () => {
  const more = deferred<unknown>()
  http.get
    .mockResolvedValueOnce({ data: posts })
    .mockResolvedValueOnce({
      data: { ...categories, data: [categories.data[0]], meta: { ...categories.meta, last_page: 2 } },
    })
    .mockReturnValueOnce(more.promise)
  renderBlogs(<BlogPostsPage />)
  await screen.findAllByText(posts.data[0].title.ar)
  await userEvent.click(screen.getByRole('button', { name: 'Filter' }))
  await userEvent.click(screen.getByRole('combobox', { name: 'Category' }))
  await screen.findByRole('option', { name: 'Personalization' })
  const viewport = document.querySelector('[data-radix-select-viewport]')!
  fireEvent.scroll(viewport)
  fireEvent.scroll(viewport)
  await waitFor(() => expect(http.get).toHaveBeenCalledTimes(3))
  await act(async () => more.reject(new Error('next page')))
  const retry = await screen.findByRole('button', { name: 'Retry categories' })
  expect(screen.getByRole('option', { name: 'Personalization' })).toBeInTheDocument()
  http.get.mockResolvedValueOnce({
    data: { ...categories, data: [categories.data[1]], meta: { ...categories.meta, current_page: 2, last_page: 2 } },
  })
  await userEvent.click(retry)
  await screen.findByRole('option', { name: 'Gift Guides' })
  fireEvent.scroll(viewport)
  expect(
    http.get.mock.calls.filter(([r]) => r.url === '/dashboard/blog-categories').map(([r]) => r.query.page)
  ).toEqual([1, 2, 2])
})
it('shows Arabic category options in an RTL selector', async () => {
  await i18n.changeLanguage('ar')
  renderBlogs(<BlogPostsPage />)
  await screen.findAllByText(posts.data[0].title.ar)
  await userEvent.click(screen.getByRole('button', { name: i18n.t('button.filter') }))
  await userEvent.click(screen.getByRole('combobox', { name: i18n.t('blogPosts.fields.category') }))
  expect(await screen.findByRole('option', { name: categories.data[0].name.ar })).toBeInTheDocument()
  expect(document.querySelector('[data-slot="select-content"]')).toHaveAttribute('dir', 'rtl')
})
