import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { BlogCategoriesList } from '../components/categories/BlogCategoriesList'
import { BlogPostsList } from '../components/posts/BlogPostsList'
import BlogPostsPage from '../pages/BlogPostsPage'
import { normalizeBlogCategory } from '../api/blog-categories.service'
import { normalizeBlogPost } from '../api/blog-posts.service'
import { rawBlogPostSchema } from '../schemas/blog-post.schema'
import categories from './blog-categories.fixture.json'
import posts from './blog-posts.fixture.json'
import { renderBlogs, setupBlogs } from './blogs-test-utils'
const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
beforeEach(async () => {
  vi.clearAllMocks()
  await setupBlogs()
  http.get.mockResolvedValue({ data: posts })
})
afterEach(() => vi.unstubAllGlobals())

describe('Blog presentation corrections', () => {
  it('removes category IDs and mirrors the five-column/two-fact layout while loading', () => {
    const loading = renderBlogs(<BlogCategoriesList loading />)
    expect(loading.container.querySelectorAll('th')).toHaveLength(5)
    expect(loading.container.querySelector('tbody tr')?.children).toHaveLength(5)
    expect(loading.container.querySelector('article')?.lastElementChild?.children).toHaveLength(2)
    loading.unmount()
    const loaded = renderBlogs(<BlogCategoriesList items={categories.data.map(normalizeBlogCategory)} />)
    expect(screen.getAllByRole('columnheader').map((node) => node.textContent)).toEqual([
      'Name',
      'Slug',
      'Created',
      'Updated',
      'Actions',
    ])
    expect(loaded.container.querySelector('tbody tr')?.children).toHaveLength(5)
    expect(loaded.container.querySelector('article dl')?.children).toHaveLength(2)
    expect(screen.queryByText('10')).not.toBeInTheDocument()
    expect(screen.queryByText('11')).not.toBeInTheDocument()
    expect(screen.queryByText('ID')).not.toBeInTheDocument()
  })
  it.each(['en', 'ar'])('selects the available %s article title with correct direction', async (language) => {
    await i18n.changeLanguage(language)
    const article = normalizeBlogPost(
      rawBlogPostSchema.parse({ ...posts.data[0], title: { ar: 'عنوان المقال', en: 'Article title' }, category: null })
    )
    renderBlogs(<BlogPostsList items={[article]} />)
    const title = language === 'ar' ? 'عنوان المقال' : 'Article title'
    expect(screen.getAllByText(title)).toHaveLength(2)
    expect(screen.getAllByTitle(title)[0]).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr')
    expect(screen.queryByText(language === 'ar' ? 'Article title' : 'عنوان المقال')).not.toBeInTheDocument()
    expect(screen.getAllByText(i18n.t('blogPosts.uncategorized'))).toHaveLength(2)
  })
  it('labels legacy Arabic fallback explicitly, keeps dates factual and removes technical slug prominence', () => {
    const article = normalizeBlogPost(
      rawBlogPostSchema.parse({ ...posts.data[0], published_at: '2099-01-01T12:00:00+00:00' })
    )
    const { container } = renderBlogs(<BlogPostsList items={[article]} />)
    expect(screen.getAllByText(/Arabic · English unavailable/)).toHaveLength(2)
    expect(screen.getAllByTitle(article.title.ar)[0]).toHaveAttribute('lang', 'ar')
    expect(container.querySelectorAll('time[datetime="2099-01-01T12:00:00+00:00"]')).toHaveLength(2)
    expect(screen.queryByText(/^Published( now)?$/)).not.toBeInTheDocument()
    expect(screen.queryByText(article.slug)).not.toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((node) => node.textContent)).toEqual([
      'Title',
      'Category',
      'Author',
      'Publication date',
      'Featured',
      'Updated',
    ])
  })
  it('mirrors the article cover, secondary metadata, six columns and five mobile facts while loading', () => {
    const loading = renderBlogs(<BlogPostsList loading />)
    expect(loading.container.querySelector('tbody tr')?.children).toHaveLength(6)
    expect(loading.container.querySelector('article')?.lastElementChild?.children).toHaveLength(5)
    expect(loading.container.querySelector('tbody tr td .space-y-1')?.children).toHaveLength(2)
    loading.unmount()
    const loaded = renderBlogs(<BlogPostsList items={[normalizeBlogPost(rawBlogPostSchema.parse(posts.data[0]))]} />)
    expect(loaded.container.querySelector('tbody tr')?.children).toHaveLength(6)
    expect(loaded.container.querySelector('article dl')?.children).toHaveLength(5)
    expect(loaded.container.querySelector('tbody tr td .space-y-1')?.children).toHaveLength(2)
  })
  it.each(['en', 'ar'])(
    'offers bilingual form fields with %s UI, no slug hints and a lazy optional category',
    async (language) => {
      await i18n.changeLanguage(language)
      renderBlogs(<BlogPostsPage />)
      await screen.findAllByText(posts.data[0].title.ar)
      await userEvent.click(screen.getByRole('button', { name: i18n.t('blogPosts.create') }))
      for (const prefix of ['title', 'excerpt', 'body']) {
        expect(
          screen.getByRole('textbox', {
            name: new RegExp(i18n.t('blogPosts.' + prefix + 'Ar').replace(/[()]/g, '\\$&')),
          })
        ).toHaveAttribute('dir', 'rtl')
        expect(
          screen.getByRole('textbox', {
            name: new RegExp(i18n.t('blogPosts.' + prefix + 'En').replace(/[()]/g, '\\$&')),
          })
        ).toHaveAttribute('dir', 'ltr')
      }
      expect(screen.queryByRole('textbox', { name: /slug/i })).not.toBeInTheDocument()
      expect(screen.queryByText(/generated from|يُنشأ الرابط/)).not.toBeInTheDocument()
      expect(http.get).toHaveBeenCalledTimes(1)
      http.get.mockResolvedValueOnce({ data: categories })
      await userEvent.click(screen.getByRole('combobox', { name: i18n.t('blogPosts.categoryOptional') }))
      expect(
        await screen.findByRole('option', { name: categories.data[0].name[language as 'ar' | 'en'] })
      ).toBeInTheDocument()
      expect(document.querySelector('[data-slot="select-content"]')).toHaveAttribute(
        'dir',
        language === 'ar' ? 'rtl' : 'ltr'
      )
    }
  )
})
