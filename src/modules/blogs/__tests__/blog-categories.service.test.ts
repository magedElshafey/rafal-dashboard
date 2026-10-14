import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blogCategoriesService, serializeBlogCategory } from '@/modules/blogs/api/blog-categories.service'
import {
  blogCategoriesEnvelopeSchema,
  createBlogCategoryFormSchema,
} from '@/modules/blogs/schemas/blog-category.schema'
import { readBlogCategoriesFilters } from '@/modules/blogs/utils/blog-category-filters'
import { blogCategoriesKeys } from '@/modules/blogs/queries/blog-categories.keys'
import fixture from '@/modules/blogs/__tests__/blog-categories.fixture.json'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
const created = {
  ...fixture.data[0],
  id: 15,
  slug: 'test',
  name: { ar: 'teset', en: 'test' },
  created_at: '2026-10-13T17:04:08+00:00',
  updated_at: '2026-10-13T17:04:08+00:00',
}
beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockResolvedValue({ data: fixture })
  http.post.mockResolvedValue({ data: { success: true, message: 'created', data: created } })
  http.put.mockResolvedValue({
    data: {
      success: true,
      message: 'updated',
      data: { ...created, name: { ar: 'test-12', en: 'test' }, updated_at: '2026-10-13T17:05:18+00:00' },
    },
  })
  http.delete.mockResolvedValue({ data: { success: true, message: 'Blog category deleted successfully' } })
})
describe('blog categories contract', () => {
  it('normalizes names and metadata and forwards pagination, filters and cancellation', async () => {
    const signal = new AbortController().signal
    const filters = readBlogCategoriesFilters({ search: ' gifts ', sort_by: 'name', sort_dir: 'desc' })
    const result = await blogCategoriesService.list(filters, 1, signal)
    expect(result.items[0]).toEqual({
      id: 10,
      slug: 'personalization',
      name: fixture.data[0].name,
      createdAt: fixture.data[0].created_at,
      updatedAt: fixture.data[0].updated_at,
    })
    expect(result.paginate).toMatchObject({
      current_page: 1,
      total_pages: 1,
      per_page: 15,
      total: 5,
      next_page_url: null,
    })
    expect(http.get).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        url: '/dashboard/blog-categories',
        query: { search: 'gifts', sort_by: 'name', sort_dir: 'desc', page: 1 },
        signal,
      })
    )
  })
  it.each(['id', 'name', 'created_at'])('accepts documented sort %s', (sort) =>
    expect(readBlogCategoriesFilters({ sort_by: sort }).sortBy).toBe(sort)
  )
  it('normalizes unsupported URL fields and canonical key identity', () => {
    expect(blogCategoriesKeys.list(readBlogCategoriesFilters({ search: ' x ', page: '8' }))).toEqual(
      blogCategoriesKeys.list(readBlogCategoriesFilters({ search: 'x' }))
    )
    expect(readBlogCategoriesFilters({ sort_by: 'slug', sort_dir: 'bad' })).toEqual(readBlogCategoriesFilters(null))
  })
  it('creates with bracketed names, including the generated slug', async () => {
    const input = { slug: '', name: { ar: ' teset ', en: ' test ' } }
    expect([...serializeBlogCategory(input).entries()]).toEqual([
      ['name[ar]', 'teset'],
      ['name[en]', 'test'],
      ['slug', 'test'],
    ])
    expect(await blogCategoriesService.create(input)).toMatchObject({ id: 15, slug: 'test', name: created.name })
    expect(http.post).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/blog-categories', isFormData: true })
    )
    expect(http.get).not.toHaveBeenCalled()
  })
  it('updates with PUT and uses the full authoritative response without Show', async () => {
    expect(
      await blogCategoriesService.update(15, { slug: 'existing-slug', name: { ar: 'test-12', en: 'test' } })
    ).toMatchObject({
      id: 15,
      name: { ar: 'test-12', en: 'test' },
      updatedAt: '2026-10-13T17:05:18+00:00',
    })
    expect(http.put.mock.calls[0][0].url).toBe('/dashboard/blog-categories/15')
    expect([...http.put.mock.calls[0][0].data.keys()]).toEqual(['name[ar]', 'name[en]', 'slug'])
    expect(http.put.mock.calls[0][0].data.get('slug')).toBe('existing-slug')
    expect(http.get).not.toHaveBeenCalled()
  })
  it('rejects an update response for another identity', async () => {
    await expect(blogCategoriesService.update(16, { slug: created.slug, name: created.name })).rejects.toThrow(
      'identity mismatch'
    )
  })
  it('accepts deletion without entity data', async () => {
    await expect(blogCategoriesService.delete(15)).resolves.toEqual({
      success: true,
      message: 'Blog category deleted successfully',
    })
  })
  it.each([0, -1, 1.5, NaN])('rejects invalid IDs %s with no request', async (id) => {
    await expect(blogCategoriesService.delete(id)).rejects.toThrow()
    await expect(blogCategoriesService.update(id, { slug: created.slug, name: created.name })).rejects.toThrow()
    expect(http.delete).not.toHaveBeenCalled()
    expect(http.put).not.toHaveBeenCalled()
  })
  it('rejects malformed records and validates whitespace', async () => {
    expect(
      blogCategoriesEnvelopeSchema.safeParse({ ...fixture, data: [{ ...fixture.data[0], name: null }] }).success
    ).toBe(false)
    await expect(
      createBlogCategoryFormSchema('required', 'invalid slug').validate({ name: { ar: ' ', en: 'test' } })
    ).rejects.toThrow('required')
  })
})
