import { beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeSlug } from '@/utils/slug'
import { createBlogCategoryFormSchema } from '../schemas/blog-category.schema'
import { createBlogPostFormSchema } from '../schemas/blog-post.schema'
import { blogCategoriesService, serializeBlogCategory } from '../api/blog-categories.service'
import { blogPostsService, serializeBlogPostCreate } from '../api/blog-posts.service'
import type { BlogPostFormValues } from '../types/blog-post.types'
const http = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
beforeEach(() => vi.clearAllMocks())
const post = (): BlogPostFormValues => ({
  slug: 'obsolete',
  title: { ar: 'دليل الهدايا', en: 'Gift Guides' },
  excerpt: { ar: 'وصف', en: 'Excerpt' },
  body: { ar: 'محتوى', en: 'Body' },
  categoryId: null,
  authorName: 'Rafal',
  isFeatured: false,
  cover: { files: [new File(['image'], 'cover.png', { type: 'image/png' })], removedExistingIds: [] },
})
describe('automatic blog slugs', () => {
  it.each([
    ['Gift Guides', 'gift-guides'],
    ['  MiXeD   Name  ', 'mixed-name'],
    ['--Gift__--Guides!! / care--', 'gift-guides-care'],
    ['Café Déjà Vu', 'café-déjà-vu'],
    ['Ｃａｆｅ', 'cafe'],
    ['دليل الهدايا', 'دليل-الهدايا'],
    ['', ''],
    [' ?! / _ -- ', ''],
  ])('normalizes %s deterministically', (source, expected) => {
    expect(normalizeSlug(source)).toBe(expected)
    expect(normalizeSlug(normalizeSlug(source))).toBe(expected)
  })
  it('derives category slug from the final English name in both schema and FormData', async () => {
    const values = { slug: 'stale-preview', name: { ar: 'الهدايا', en: '  Gift Guides  ' } }
    const validated = await createBlogCategoryFormSchema('required', 'invalid').validate(values)
    expect(validated.slug).toBe('gift-guides')
    expect(serializeBlogCategory(values).get('slug')).toBe(validated.slug)
    expect(values.name.en).toBe('  Gift Guides  ')
  })
  it('preserves legacy category slug during edit and sends it unchanged in PUT fields', async () => {
    const values = { slug: 'Legacy_URL', name: { ar: 'تغيير', en: 'Renamed Category' } }
    expect((await createBlogCategoryFormSchema('required', 'invalid', 'edit').validate(values)).slug).toBe('Legacy_URL')
    expect([...serializeBlogCategory(values, 'edit').keys()]).toEqual(['name[ar]', 'name[en]', 'slug'])
    expect(serializeBlogCategory(values, 'edit').get('slug')).toBe('Legacy_URL')
  })
  it('derives a post slug from the final English title without altering either language', async () => {
    const values = post()
    values.title.ar = '  دليل الهدايا  '
    values.title.en = '  Latest Gift Guide  '
    const validated = await createBlogPostFormSchema('required', 'image', 'invalid', 'category').validate(values)
    expect(validated.slug).toBe('latest-gift-guide')
    expect(serializeBlogPostCreate(values).get('slug')).toBe(validated.slug)
    expect(serializeBlogPostCreate(values).get('title[en]')).toBe('Latest Gift Guide')
    expect(values.title.ar).toBe('  دليل الهدايا  ')
  })
  it.each(['', '?! / --'])('rejects unusable source %s before HTTP', async (source) => {
    const category = { slug: 'stale', name: { ar: 'اسم', en: source } }
    const article = { ...post(), title: { ar: 'عنوان', en: source } }
    await expect(createBlogCategoryFormSchema('required', 'invalid').validate(category)).rejects.toThrow()
    await expect(
      createBlogPostFormSchema('required', 'image', 'invalid', 'category').validate(article)
    ).rejects.toThrow()
    await expect(blogCategoriesService.create(category)).rejects.toThrow()
    await expect(blogPostsService.create(article)).rejects.toThrow()
    expect(http.post).not.toHaveBeenCalled()
  })
})
