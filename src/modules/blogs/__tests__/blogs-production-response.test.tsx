import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import BlogPostsPage from '../pages/BlogPostsPage'
import { blogPostsService } from '../api/blog-posts.service'
import { readBlogPostsFilters } from '../utils/blog-post-filters'
import { blogPostsEnvelopeSchema } from '../schemas/blog-post.schema'
import observed from './blog-posts-null-category.fixture.json'
import examples from './blog-posts.fixture.json'
import { renderBlogs, setupBlogs } from './blogs-test-utils'
const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
// Only the null-category record was provided verbatim. The other nine are test records.
const tenPosts = {
  ...observed,
  data: [...observed.data, ...Array.from({ length: 9 }, (_, i) => ({ ...examples.data[0], id: 100 + i }))],
}
beforeEach(async () => {
  vi.resetAllMocks()
  await setupBlogs()
  http.get.mockResolvedValue({ data: tenPosts })
})
afterEach(() => vi.unstubAllGlobals())
describe('production null category regression', () => {
  it('parses all ten records without fabricating a category or English translation', async () => {
    const result = await blogPostsService.list(readBlogPostsFilters(null), 1)
    expect(result.items).toHaveLength(10)
    expect(result.items[0]).toMatchObject({
      category: null,
      publishedAt: null,
      title: { ar: observed.data[0].title.ar },
    })
    expect(result.items[0].title).not.toHaveProperty('en')
    expect(result.items[1].category).toEqual(examples.data[0].category)
    expect(http.get).toHaveBeenCalledTimes(1)
  })
  it.each(['en', 'ar'])('renders the mixed list in %s with one request and no generic error', async (language) => {
    await i18n.changeLanguage(language)
    renderBlogs(<BlogPostsPage />)
    expect(await screen.findAllByText(language === 'ar' ? 'بدون تصنيف' : 'Uncategorized')).toHaveLength(2)
    expect(screen.getAllByText(observed.data[0].title.ar)).toHaveLength(2)
    expect(screen.getAllByText(examples.data[0].category.name[language as 'ar' | 'en'])).toHaveLength(18)
    expect(screen.queryByText('Unable to load content')).not.toBeInTheDocument()
    expect(screen.queryByText('تعذر تحميل المحتوى')).not.toBeInTheDocument()
    expect(http.get).toHaveBeenCalledTimes(1)
  })
  it('still rejects malformed categories, booleans and missing required Arabic fields', () => {
    for (const change of [
      { category: {} },
      { category: { ...examples.data[0].category, id: 0 } },
      { is_featured: 'yes' },
      { title: { en: 'Only English' } },
    ]) {
      expect(
        blogPostsEnvelopeSchema.safeParse({ ...observed, data: [{ ...observed.data[0], ...change }] }).success
      ).toBe(false)
    }
  })
})
