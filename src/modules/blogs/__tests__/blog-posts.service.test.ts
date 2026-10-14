import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blogPostsService, normalizeBlogPost, serializeBlogPostCreate } from '@/modules/blogs/api/blog-posts.service'
import { rawBlogPostSchema, createBlogPostFormSchema } from '@/modules/blogs/schemas/blog-post.schema'
import {
  readBlogPostsFilters,
  serializeBlogPostsFilters,
  validBlogPublishedRange,
} from '@/modules/blogs/utils/blog-post-filters'
import { blogPostsKeys } from '@/modules/blogs/queries/blog-posts.keys'
import type { BlogPostFormValues } from '@/modules/blogs/types/blog-post.types'
import fixture from '@/modules/blogs/__tests__/blog-posts.fixture.json'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockResolvedValue({ data: fixture })
  http.post.mockResolvedValue({ status: 201 })
})
export function values(): BlogPostFormValues {
  return {
    slug: ' article ',
    title: { ar: ' عنوان ', en: ' English title ' },
    excerpt: { ar: ' مقتطف ', en: ' English excerpt ' },
    body: { ar: ' محتوى ', en: ' English body ' },
    categoryId: null,
    authorName: ' Rafal ',
    isFeatured: false,
    cover: { files: [new File(['image'], 'cover.png', { type: 'image/png' })], removedExistingIds: [] },
  }
}
describe('blog posts contract', () => {
  it('parses Arabic-only articles, nested category, null publication and backend reading time', async () => {
    const signal = new AbortController().signal
    const result = await blogPostsService.list(readBlogPostsFilters(null), 1, signal)
    expect(result.items[0]).toMatchObject({
      title: fixture.data[0].title,
      category: fixture.data[0].category,
      readingTimeMinutes: 1,
    })
    expect(result.items[1].publishedAt).toBeNull()
    expect(result.items[0].title).not.toHaveProperty('en')
    expect(result.paginate).toMatchObject({ total: 9, total_pages: 1, next_page_url: null })
    expect(http.get).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ url: '/dashboard/blog-posts', query: { page: 1 }, signal })
    )
  })
  it('serializes every documented filter and isolates query keys', async () => {
    const filters = readBlogPostsFilters({
      search: ' gifts ',
      blog_category_id: '11',
      is_published: '0',
      is_featured: '1',
      published_from: '2026-09-01',
      published_to: '2026-09-30',
      sort_by: 'published_at',
      sort_dir: 'asc',
    })
    const query = {
      search: 'gifts',
      blog_category_id: 11,
      is_published: 0,
      is_featured: 1,
      published_from: '2026-09-01',
      published_to: '2026-09-30',
      sort_by: 'published_at',
      sort_dir: 'asc',
    }
    expect(serializeBlogPostsFilters(filters)).toEqual(query)
    expect(blogPostsKeys.list(filters).at(-1)).toEqual(query)
    expect(blogPostsKeys.list(filters)).not.toEqual(blogPostsKeys.list({ ...filters, isFeatured: false }))
    await blogPostsService.list(filters, 2)
    expect(http.get).toHaveBeenCalledWith(expect.objectContaining({ query: { ...query, page: 2 } }))
  })
  it.each(['created_at', 'published_at', 'title', 'is_featured'])('accepts sort %s', (sort) => {
    expect(readBlogPostsFilters({ sort_by: sort }).sortBy).toBe(sort)
  })
  it('normalizes unsupported values and ignores unrelated URL state', () => {
    expect(
      readBlogPostsFilters({
        sort_by: 'author_name',
        sort_dir: 'sideways',
        blog_category_id: '1e2',
        is_featured: 'yes',
      })
    ).toEqual(readBlogPostsFilters(null))
    expect(blogPostsKeys.list(readBlogPostsFilters({ page: '2', unrelated: 'x', search: ' ' }))).toEqual(
      blogPostsKeys.list(readBlogPostsFilters(null))
    )
  })
  it.each([
    ['2026-02-30', ''],
    ['2026-10-10', '2026-10-01'],
    ['bad', ''],
  ])('rejects invalid ranges %s %s before HTTP', async (from, to) => {
    const filters = readBlogPostsFilters({ published_from: from, published_to: to })
    expect(validBlogPublishedRange(filters)).toBe(false)
    await expect(blogPostsService.list(filters, 1)).rejects.toThrow()
    expect(http.get).not.toHaveBeenCalled()
  })
  it('rejects malformed responses instead of inventing values', () => {
    expect(rawBlogPostSchema.safeParse({ ...fixture.data[0], is_featured: 'false' }).success).toBe(false)
    expect(rawBlogPostSchema.safeParse({ ...fixture.data[0], id: 0 }).success).toBe(false)
    expect(normalizeBlogPost(rawBlogPostSchema.parse(fixture.data[1])).publishedAt).toBeNull()
  })
  it('sends a real file and the intended bilingual multipart fields without headers or lookups', async () => {
    const input = values()
    const data = serializeBlogPostCreate(input)
    expect([...data.keys()].sort()).toEqual(
      [
        'slug',
        'title[ar]',
        'title[en]',
        'excerpt[ar]',
        'excerpt[en]',
        'body[ar]',
        'body[en]',
        'author_name',
        'is_featured',
        'cover',
      ].sort()
    )
    expect(data.get('cover')).toBe(input.cover.files[0])
    expect(data.get('title[ar]')).toBe('عنوان')
    expect(data.get('slug')).toBe('english-title')
    expect(data.get('is_featured')).toBe('0')
    expect(serializeBlogPostCreate({ ...input, isFeatured: true }).get('is_featured')).toBe('1')
    await blogPostsService.create(input)
    expect(http.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/blog-posts', isFormData: true, data: expect.any(FormData) })
    )
    expect(http.post.mock.calls[0][0]).not.toHaveProperty('headers')
    expect(http.get).not.toHaveBeenCalled()
  })
  it.each([new File([], 'empty.png', { type: 'image/png' }), new File(['text'], 'fake.txt', { type: 'text/plain' })])(
    'rejects unsafe file selection before HTTP',
    async (file) => {
      const input = values()
      input.cover.files = [file]
      await expect(blogPostsService.create(input)).rejects.toThrow('Invalid blog cover')
      expect(http.post).not.toHaveBeenCalled()
    }
  )
  it('validates whitespace and missing images without fabricated upload limits', async () => {
    const schema = createBlogPostFormSchema('required', 'image', 'invalid slug', 'invalid category')
    await expect(schema.validate(values())).resolves.toBeDefined()
    await expect(schema.validate({ ...values(), title: { ar: '  ', en: 'English title' } })).rejects.toThrow('required')
    await expect(schema.validate({ ...values(), cover: { files: [], removedExistingIds: [] } })).rejects.toThrow(
      'image'
    )
  })
})

it('serializes every intended English field and omits an unassigned category', () => {
  const input = values()
  const body = serializeBlogPostCreate(input)
  expect(body.get('title[en]')).toBe('English title')
  expect(body.get('excerpt[en]')).toBe('English excerpt')
  expect(body.get('body[en]')).toBe('English body')
  expect(body.has('category_id')).toBe(false)
  expect(body.has('category')).toBe(false)
  expect(body.has('blog_category_id')).toBe(false)
})
it('submits a selected positive category as category_id, keeping the index filter contract distinct', async () => {
  const input = { ...values(), categoryId: 11 }
  await blogPostsService.create(input)
  expect(http.post.mock.calls[0][0].data.get('category_id')).toBe('11')
  expect(http.post.mock.calls[0][0].data.has('category')).toBe(false)
  expect(http.post.mock.calls[0][0].data.has('blog_category_id')).toBe(false)
  expect(serializeBlogPostsFilters(readBlogPostsFilters({ blog_category_id: '11' }))).toEqual({ blog_category_id: 11 })
})
it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, '11', undefined])(
  'rejects invalid selected category %s before HTTP',
  async (categoryId) => {
    const input = { ...values(), categoryId: categoryId as never }
    await expect(createBlogPostFormSchema('required', 'image', 'slug', 'category').validate(input)).rejects.toThrow()
    await expect(blogPostsService.create(input)).rejects.toThrow()
    expect(http.post).not.toHaveBeenCalled()
  }
)
it('accepts optional English response text without fabricating translations or weakening its type', () => {
  const bilingual = {
    ...fixture.data[0],
    title: { ar: 'عنوان', en: 'Title' },
    excerpt: { ar: 'وصف', en: 'Excerpt' },
    body: { ar: 'محتوى', en: 'Body' },
    category: null,
  }
  expect(normalizeBlogPost(rawBlogPostSchema.parse(bilingual))).toMatchObject({
    title: bilingual.title,
    excerpt: bilingual.excerpt,
    body: bilingual.body,
    category: null,
  })
  expect(rawBlogPostSchema.safeParse({ ...bilingual, title: { ar: 'عنوان', en: 123 } }).success).toBe(false)
  expect(rawBlogPostSchema.safeParse({ ...bilingual, title: { ar: 'عنوان', en: null } }).success).toBe(false)
})
