import i18n from '@/config/i18'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BlogCategoriesPage from '@/modules/blogs/pages/BlogCategoriesPage'
import { blogCategoriesKeys } from '@/modules/blogs/queries/blog-categories.keys'
import { readBlogCategoriesFilters } from '@/modules/blogs/utils/blog-category-filters'
import { blogPostsKeys } from '@/modules/blogs/queries/blog-posts.keys'
import { readBlogPostsFilters } from '@/modules/blogs/utils/blog-post-filters'
import BlogPostsPage from '@/modules/blogs/pages/BlogPostsPage'
import categories from '@/modules/blogs/__tests__/blog-categories.fixture.json'
import posts from '@/modules/blogs/__tests__/blog-posts.fixture.json'
import { deferred, renderBlogs, setupBlogs } from '@/modules/blogs/__tests__/blogs-test-utils'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const created = {
  ...categories.data[0],
  id: 15,
  slug: 'test',
  name: { ar: 'teset', en: 'test' },
  created_at: '2026-10-13T17:04:08+00:00',
  updated_at: '2026-10-13T17:04:08+00:00',
}
beforeEach(async () => {
  vi.resetAllMocks()
  await setupBlogs()
  http.get.mockImplementation(async ({ url }) => ({ data: url === '/dashboard/blog-categories' ? categories : posts }))
  http.post.mockResolvedValue({ data: { success: true, message: 'created', data: created } })
})
afterEach(() => vi.unstubAllGlobals())
async function fillPost() {
  await userEvent.click(screen.getByRole('button', { name: 'Create blog post' }))
  expect(screen.queryByRole('textbox', { name: /^Slug/ })).not.toBeInTheDocument()
  await userEvent.type(screen.getByRole('textbox', { name: /Title \(Arabic\)/ }), 'عنوان')
  await userEvent.type(screen.getByRole('textbox', { name: /Excerpt \(Arabic\)/ }), 'مقتطف')
  await userEvent.type(screen.getByRole('textbox', { name: /Body \(Arabic\)/ }), 'محتوى')
  await userEvent.type(screen.getByRole('textbox', { name: /Title \(English\)/ }), 'English title')
  await userEvent.type(screen.getByRole('textbox', { name: /Excerpt \(English\)/ }), 'English excerpt')
  await userEvent.type(screen.getByRole('textbox', { name: /Body \(English\)/ }), 'English body')
  await userEvent.type(screen.getByRole('textbox', { name: /Author/ }), 'Rafal')
  const file = new File(['image'], 'cover.png', { type: 'image/png' })
  await userEvent.upload(screen.getByLabelText('Browse images', { selector: 'input' }), file)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create post' })).toBeEnabled())
  return file
}
describe('blog forms', () => {
  it('creates a category exactly once with localized fields, a derived slug and no Show lookup', async () => {
    const pending = deferred<unknown>()
    http.post.mockReturnValue(pending.promise)
    renderBlogs(<BlogCategoriesPage />)
    await screen.findAllByText('Personalization')
    await userEvent.click(screen.getByRole('button', { name: 'Create category' }))
    const dialog = screen.getByRole('dialog')
    const submit = within(dialog).getByRole('button', { name: 'Create category' })
    expect(submit).toBeDisabled()
    await userEvent.type(screen.getByRole('textbox', { name: /Name \(Arabic\)/ }), 'teset')
    await userEvent.type(screen.getByRole('textbox', { name: /Name \(English\)/ }), 'test')
    await waitFor(() => expect(submit).toBeEnabled())
    fireEvent.click(submit)
    fireEvent.click(submit)
    await waitFor(() => expect(http.post).toHaveBeenCalledTimes(1))
    expect([...http.post.mock.calls[0][0].data.entries()]).toEqual([
      ['name[ar]', 'teset'],
      ['name[en]', 'test'],
      ['slug', 'test'],
    ])
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await act(async () => pending.resolve({ data: { success: true, message: 'created', data: created } }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(http.get.mock.calls.every(([request]) => request.url === '/dashboard/blog-categories')).toBe(true)
  })
  it('creates another category with clean values and focus retained', async () => {
    renderBlogs(<BlogCategoriesPage />)
    await screen.findAllByText('Personalization')
    await userEvent.click(screen.getByRole('button', { name: 'Create category' }))
    const ar = screen.getByRole('textbox', { name: /Name \(Arabic\)/ })
    await userEvent.type(ar, 'teset')
    await userEvent.type(screen.getByRole('textbox', { name: /Name \(English\)/ }), 'test')
    await userEvent.click(screen.getByRole('button', { name: 'Create & create another' }))
    await waitFor(() => expect(ar).toHaveValue(''))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await waitFor(() => expect(ar).toHaveFocus())
  })
  it('edits from full list data, disables pristine updates and retains a coherent snapshot on failed refresh', async () => {
    const updated = {
      ...categories.data[0],
      name: { ar: 'محدث', en: 'Updated' },
      updated_at: '2026-10-13T17:05:18+00:00',
    }
    http.put.mockResolvedValue({ data: { success: true, message: 'updated', data: updated } })
    const { client } = renderBlogs(<BlogCategoriesPage />)
    await screen.findAllByText('Personalization')
    client.setQueryData(blogPostsKeys.list(readBlogPostsFilters(null)), { pages: [], pageParams: [] })
    client.setQueryData(['unrelated'], { keep: true })
    await userEvent.click(screen.getAllByRole('button', { name: 'Edit category Personalization' })[0])
    expect(http.get).toHaveBeenCalledTimes(1)
    const submit = screen.getByRole('button', { name: 'Update category' })
    expect(submit).toBeDisabled()
    const name = screen.getByRole('textbox', { name: /Name \(English\)/ })
    expect(name).toHaveValue('Personalization')
    await userEvent.clear(name)
    await userEvent.type(name, 'Updated')
    await waitFor(() => expect(submit).toBeEnabled())
    http.get.mockRejectedValueOnce(new Error('refresh fails'))
    await userEvent.click(submit)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findAllByText('Personalization', { selector: 'bdi' })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: 'Edit category Personalization' })[0]).toBeDisabled()
    expect(http.put.mock.calls[0][0].data.get('slug')).toBe(categories.data[0].slug)
    const cached = client.getQueryData<{ pages: { items: { name: { en: string }; updatedAt: string }[] }[] }>(
      blogCategoriesKeys.list(readBlogCategoriesFilters(null))
    )
    expect(cached?.pages[0].items[0]).toMatchObject({
      name: { en: 'Personalization' },
      updatedAt: categories.data[0].updated_at,
    })
    expect(client.getQueryState(blogPostsKeys.list(readBlogPostsFilters(null)))?.isInvalidated).toBe(true)
    expect(client.getQueryState(['unrelated'])?.isInvalidated).toBe(false)
    expect(http.get.mock.calls.every(([request]) => request.url === '/dashboard/blog-categories')).toBe(true)
  })
  it('maps category 422 errors and preserves both names', async () => {
    http.post.mockRejectedValue({
      isAxiosError: true,
      response: { status: 422, data: { message: 'Validation failed', errors: { 'name.en': ['Name already exists'] } } },
    })
    renderBlogs(<BlogCategoriesPage />)
    await screen.findAllByText('Personalization')
    await userEvent.click(screen.getByRole('button', { name: 'Create category' }))
    await userEvent.type(screen.getByRole('textbox', { name: /Name \(Arabic\)/ }), 'teset')
    const en = screen.getByRole('textbox', { name: /Name \(English\)/ })
    await userEvent.type(en, 'test')
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create category' }))
    expect(await screen.findByText('Name already exists')).toBeInTheDocument()
    expect(en).toHaveValue('test')
    expect(screen.getByRole('textbox', { name: /Name \(Arabic\)/ })).toHaveValue('teset')
  })
  it('uploads a real file once, blocks close while pending and cleans previews on success', async () => {
    const pending = deferred<unknown>()
    http.post.mockReturnValue(pending.promise)
    renderBlogs(<BlogPostsPage />)
    await screen.findAllByText(posts.data[0].title.ar)
    const file = await fillPost()
    expect(screen.getByRole('img', { name: 'cover.png' })).toHaveAttribute('src', 'blob:blog-cover')
    const submit = screen.getByRole('button', { name: 'Create post' })
    fireEvent.click(submit)
    fireEvent.click(submit)
    await waitFor(() => expect(http.post).toHaveBeenCalledTimes(1))
    expect(http.post.mock.calls[0][0].data.get('cover')).toBe(file)
    expect(http.post.mock.calls[0][0].data.get('slug')).toBe('english-title')
    expect(http.post.mock.calls[0][0].data.has('blog_category_id')).toBe(false)
    expect(http.post.mock.calls[0][0].data.has('published_at')).toBe(false)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await act(async () => pending.resolve({ status: 201, data: undefined }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:blog-cover')
    expect(http.get.mock.calls.map(([request]) => request.url)).toEqual([
      '/dashboard/blog-posts',
      '/dashboard/blog-posts',
    ])
  })
  it.each(['422', 'network'])('preserves post content and file after %s failure', async (kind) => {
    http.post.mockRejectedValue(
      kind === '422'
        ? {
            isAxiosError: true,
            response: {
              status: 422,
              data: {
                message: 'Validation failed',
                errors: {
                  'title.ar': ['Title needs correction'],
                  'excerpt.ar': ['Excerpt needs correction'],
                  'body.ar': ['Body needs correction'],
                },
              },
            },
          }
        : new Error('internal')
    )
    renderBlogs(<BlogPostsPage />)
    await screen.findAllByText(posts.data[0].title.ar)
    await fillPost()
    await userEvent.click(screen.getByRole('button', { name: 'Create post' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      kind === '422' ? 'Validation failed' : 'Could not create the blog post'
    )
    if (kind === '422') {
      expect(screen.getByText('Title needs correction')).toBeInTheDocument()
      expect(screen.getByText('Excerpt needs correction')).toBeInTheDocument()
      expect(screen.getByText('Body needs correction')).toBeInTheDocument()
    }
    expect(screen.getByRole('textbox', { name: /Title \(Arabic\)/ })).toHaveValue('عنوان')
    expect(screen.getByRole('textbox', { name: /Body \(Arabic\)/ })).toHaveValue('محتوى')
    expect(screen.getByRole('img', { name: 'cover.png' })).toBeInTheDocument()
    expect(http.get).toHaveBeenCalledTimes(1)
  })
  it('replaces an unsubmitted image and revokes its old preview without a request', async () => {
    renderBlogs(<BlogPostsPage />)
    await screen.findAllByText(posts.data[0].title.ar)
    await fillPost()
    const replacement = new File(['replacement'], 'new.png', { type: 'image/png' })
    await userEvent.click(screen.getByRole('button', { name: 'Replace cover.png' }))
    await userEvent.upload(screen.getByLabelText('Choose a replacement image'), replacement)
    expect(await screen.findByRole('img', { name: 'new.png' })).toBeInTheDocument()
    expect(URL.revokeObjectURL).toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
  })
})

it('keeps an edit draft when a refreshed category no longer belongs to the list', async () => {
  const { client } = renderBlogs(<BlogCategoriesPage />, '?search=Personalization&sort_by=name')
  await screen.findAllByText('Personalization')
  await userEvent.click(screen.getAllByRole('button', { name: 'Edit category Personalization' })[0])
  const name = screen.getByRole('textbox', { name: /Name \(English\)/ })
  await userEvent.clear(name)
  await userEvent.type(name, 'My unsaved draft')
  http.get.mockResolvedValueOnce({ data: { ...categories, data: [], meta: { ...categories.meta, total: 0 } } })
  await act(async () => {
    await client.invalidateQueries({ queryKey: blogCategoriesKeys.lists() })
  })
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(name).toHaveValue('My unsaved draft')
  expect(screen.getByRole('button', { name: 'Update category' })).toBeEnabled()
  expect(http.put).not.toHaveBeenCalled()
})
it.each(['category', 'post'])('maps duplicate slug errors to the %s source and retains the draft', async (kind) => {
  http.post.mockRejectedValue({
    isAxiosError: true,
    response: { status: 422, data: { message: 'Validation failed', errors: { slug: ['This slug is already used'] } } },
  })
  renderBlogs(kind === 'category' ? <BlogCategoriesPage /> : <BlogPostsPage />)
  if (kind === 'category') {
    await screen.findAllByText('Personalization')
    await userEvent.click(screen.getByRole('button', { name: 'Create category' }))
    await userEvent.type(screen.getByRole('textbox', { name: /Name \(Arabic\)/ }), 'هدايا')
    await userEvent.type(screen.getByRole('textbox', { name: /Name \(English\)/ }), 'Gift Guides')
  } else {
    await screen.findAllByText(posts.data[0].title.ar)
    await fillPost()
  }
  const dialog = screen.getByRole('dialog')
  await userEvent.click(
    within(dialog).getByRole('button', { name: kind === 'category' ? 'Create category' : 'Create post' })
  )
  expect(await screen.findByText('This slug is already used')).toBeInTheDocument()
  const source = screen.getByRole('textbox', { name: kind === 'category' ? /Name \(English\)/ : /Title \(English\)/ })
  expect(source).toHaveValue(kind === 'category' ? 'Gift Guides' : 'English title')
  expect(source).toHaveAttribute('aria-invalid', 'true')
  if (kind === 'post') expect(screen.getByRole('img', { name: 'cover.png' })).toBeInTheDocument()
  expect(http.get).toHaveBeenCalledTimes(1)
})
it('validates and submits the latest category name without requests while typing', async () => {
  renderBlogs(<BlogCategoriesPage />)
  await screen.findAllByText('Personalization')
  await userEvent.click(screen.getByRole('button', { name: 'Create category' }))
  await userEvent.type(screen.getByRole('textbox', { name: /Name \(Arabic\)/ }), 'هدايا')
  const source = screen.getByRole('textbox', { name: /Name \(English\)/ })
  await userEvent.type(source, '?! / --')
  const submit = within(screen.getByRole('dialog')).getByRole('button', { name: 'Create category' })
  expect(submit).toBeDisabled()
  expect(screen.getByText('Enter text containing letters or numbers.')).toBeInTheDocument()
  expect(http.post).not.toHaveBeenCalled()
  await userEvent.clear(source)
  await userEvent.type(source, ' First Name ')
  await userEvent.clear(source)
  await userEvent.type(source, ' Latest Gift Guides ')
  expect(source).toHaveValue(' Latest Gift Guides ')
  expect(http.get).toHaveBeenCalledTimes(1)
  await userEvent.click(submit)
  await waitFor(() => expect(http.post).toHaveBeenCalledTimes(1))
  expect(http.post.mock.calls[0][0].data.get('slug')).toBe('latest-gift-guides')
})
it('creates another post, clears its file and restores Arabic title focus', async () => {
  renderBlogs(<BlogPostsPage />)
  await screen.findAllByText(posts.data[0].title.ar)
  await fillPost()
  await userEvent.click(screen.getByRole('button', { name: 'Create & create another' }))
  const title = screen.getByRole('textbox', { name: /Title \(Arabic\)/ })
  await waitFor(() => expect(title).toHaveValue(''))
  await waitFor(() => expect(title).toHaveFocus())
  expect(screen.getByRole('textbox', { name: /Body \(Arabic\)/ })).toHaveValue('')
  expect(screen.queryByRole('img', { name: 'cover.png' })).not.toBeInTheDocument()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:blog-cover')
  expect(screen.getByRole('button', { name: 'Create post' })).toBeDisabled()
})

it.each(['category', 'post'])('refreshes %s after creation even while the initial list is unfinished', async (kind) => {
  const initial = deferred<unknown>()
  http.get.mockReturnValueOnce(initial.promise)
  renderBlogs(kind === 'category' ? <BlogCategoriesPage /> : <BlogPostsPage />)
  await waitFor(() => expect(http.get).toHaveBeenCalledTimes(1))
  const signal = http.get.mock.calls[0][0].signal as AbortSignal
  if (kind === 'category') {
    await userEvent.click(screen.getByRole('button', { name: 'Create category' }))
    await userEvent.type(screen.getByRole('textbox', { name: /Name \(Arabic\)/ }), 'هدايا')
    await userEvent.type(screen.getByRole('textbox', { name: /Name \(English\)/ }), 'Gift Guides')
  } else await fillPost()
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: kind === 'category' ? 'Create category' : 'Create post',
    })
  )
  await waitFor(() => expect(http.get).toHaveBeenCalledTimes(2))
  expect(signal.aborted).toBe(true)
  const text = kind === 'category' ? 'Personalization' : posts.data[0].title.ar
  await screen.findAllByText(text)
  const fixture = kind === 'category' ? categories : posts
  await act(async () => initial.resolve({ data: { ...fixture, data: [], meta: { ...fixture.meta, total: 0 } } }))
  expect(screen.getAllByText(text)).toHaveLength(2)
  expect(http.post).toHaveBeenCalledTimes(1)
  expect(http.get).toHaveBeenCalledTimes(2)
})

it('keeps a selected category, bilingual content and image after category/English 422 errors', async () => {
  http.post.mockRejectedValue({
    isAxiosError: true,
    response: {
      status: 422,
      data: {
        message: 'Validation failed',
        errors: {
          category_id: ['Category needs correction'],
          'title.en': ['English title needs correction'],
          'excerpt.en': ['English excerpt needs correction'],
          'body.en': ['English body needs correction'],
        },
      },
    },
  })
  renderBlogs(<BlogPostsPage />)
  await screen.findAllByText(posts.data[0].title.ar)
  await fillPost()
  expect(http.get).toHaveBeenCalledTimes(1)
  await userEvent.click(screen.getByRole('combobox', { name: 'Category (optional)' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Gift Guides' }))
  await userEvent.type(screen.getByRole('textbox', { name: /Author/ }), ' team')
  expect(screen.getByRole('combobox', { name: 'Category (optional)' })).toHaveTextContent('Gift Guides')
  await userEvent.click(screen.getByRole('button', { name: 'Create post' }))
  expect(await screen.findByText('Category needs correction')).toBeInTheDocument()
  expect(screen.getByText('English title needs correction')).toBeInTheDocument()
  expect(screen.getByText('English excerpt needs correction')).toBeInTheDocument()
  expect(screen.getByText('English body needs correction')).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: /Title \(English\)/ })).toHaveValue('English title')
  expect(screen.getByRole('textbox', { name: /Body \(English\)/ })).toHaveValue('English body')
  expect(screen.getByRole('textbox', { name: /Title \(Arabic\)/ })).toHaveValue('عنوان')
  expect(screen.getByRole('combobox', { name: 'Category (optional)' })).toHaveTextContent('Gift Guides')
  expect(screen.getByRole('img', { name: 'cover.png' })).toBeInTheDocument()
  expect(http.post.mock.calls[0][0].data.get('category_id')).toBe('11')
  expect(http.post.mock.calls[0][0].data.has('blog_category_id')).toBe(false)
  expect(http.get).toHaveBeenCalledTimes(2)
})
it('allows clearing a selected category and omits it from a successful create', async () => {
  renderBlogs(<BlogPostsPage />)
  await screen.findAllByText(posts.data[0].title.ar)
  await fillPost()
  await userEvent.click(screen.getByRole('combobox', { name: 'Category (optional)' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Gift Guides' }))
  await userEvent.click(screen.getByRole('button', { name: 'Clear category' }))
  expect(screen.getByRole('combobox', { name: 'Category (optional)' })).toHaveTextContent('Uncategorized')
  await userEvent.click(screen.getByRole('button', { name: 'Create post' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(http.post.mock.calls[0][0].data.has('category_id')).toBe(false)
})
it('lazily paginates form categories, blocks duplicate scroll requests and retries failures', async () => {
  renderBlogs(<BlogPostsPage />)
  await screen.findAllByText(posts.data[0].title.ar)
  await userEvent.click(screen.getByRole('button', { name: 'Create blog post' }))
  expect(http.get).toHaveBeenCalledTimes(1)
  http.get.mockRejectedValueOnce(new Error('offline'))
  await userEvent.click(screen.getByRole('combobox', { name: 'Category (optional)' }))
  const retry = await screen.findByRole('button', { name: 'Retry categories' })
  http.get.mockResolvedValueOnce({
    data: { ...categories, data: [categories.data[0]], meta: { ...categories.meta, last_page: 2 } },
  })
  await userEvent.click(retry)
  await screen.findByRole('option', { name: 'Personalization' })
  const pending = deferred<unknown>()
  http.get.mockReturnValueOnce(pending.promise)
  const viewport = document.querySelector('[data-radix-select-viewport]')!
  fireEvent.scroll(viewport)
  fireEvent.scroll(viewport)
  await waitFor(() => expect(http.get).toHaveBeenCalledTimes(4))
  await act(async () => pending.reject(new Error('next page')))
  expect(await screen.findByRole('button', { name: 'Retry categories' })).toBeInTheDocument()
  http.get.mockResolvedValueOnce({
    data: { ...categories, data: [categories.data[1]], meta: { ...categories.meta, current_page: 2, last_page: 2 } },
  })
  await userEvent.click(screen.getByRole('button', { name: 'Retry categories' }))
  await userEvent.click(await screen.findByRole('option', { name: 'Gift Guides' }))
  expect(screen.getByRole('combobox', { name: 'Category (optional)' })).toHaveTextContent('Gift Guides')
  expect(
    http.get.mock.calls.filter(([r]) => r.url === '/dashboard/blog-categories').map(([r]) => r.query.page)
  ).toEqual([1, 1, 2, 2])
  expect(http.post).not.toHaveBeenCalled()
})
it('displays persisted-slug edit errors without suggesting an automatic URL change', async () => {
  http.put.mockRejectedValue({
    isAxiosError: true,
    response: { status: 422, data: { message: 'Validation failed', errors: { slug: ['Stored slug rejected'] } } },
  })
  renderBlogs(<BlogCategoriesPage />)
  await screen.findAllByText('Personalization')
  await userEvent.click(screen.getAllByRole('button', { name: 'Edit category Personalization' })[0])
  await userEvent.type(screen.getByRole('textbox', { name: /Name \(English\)/ }), ' changed')
  await userEvent.click(screen.getByRole('button', { name: 'Update category' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Stored slug rejected')
  expect(http.put.mock.calls[0][0].data.get('slug')).toBe('personalization')
  expect(screen.getByRole('textbox', { name: /Name \(English\)/ })).toHaveValue('Personalization changed')
  expect(screen.queryByRole('textbox', { name: /slug/i })).not.toBeInTheDocument()
})

it('allows an unassigned post when the category catalog is empty', async () => {
  renderBlogs(<BlogPostsPage />)
  await screen.findAllByText(posts.data[0].title.ar)
  await fillPost()
  http.get.mockResolvedValueOnce({ data: { ...categories, data: [], meta: { ...categories.meta, total: 0 } } })
  await userEvent.click(screen.getByRole('combobox', { name: 'Category (optional)' }))
  expect(await screen.findByText(i18n.t('label.no_options'))).toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  expect(screen.getByRole('button', { name: 'Create post' })).toBeEnabled()
  await userEvent.click(screen.getByRole('button', { name: 'Create post' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(http.post.mock.calls[0][0].data.has('category_id')).toBe(false)
})
