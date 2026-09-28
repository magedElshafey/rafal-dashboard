import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { serializeStaticPageUpdate, staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import type { RawStaticPage, StaticPageCreatePayload } from '@/modules/static-pages/types/static-page.types'

const rawPage: RawStaticPage = {
  id: 2,
  slug: 'legacy Slug',
  title: { ar: 'سياسة الخصوصية' },
  content: { ar: 'محتوى' },
  is_published: 1,
  is_system: false,
  created_at: '2026-09-28T13:31:50+00:00',
  updated_at: '2026-09-28T13:31:50+00:00',
}

const createPayload: StaticPageCreatePayload = {
  slug: ' Privacy / Policy? ',
  title: { ar: ' سياسة الخصوصية ', en: ' Privacy Policy ' },
  content: { ar: ' محتوى ', en: ' Content ' },
  isPublished: true,
  isSystem: false,
}

describe('staticPagesService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GETs the exact paginated Index with only page and tolerates historical missing locales', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({
      data: {
        success: true,
        message: 'ok',
        data: [rawPage],
        meta: { current_page: 2, last_page: 3, per_page: 15, total: 31 },
      },
    })

    const result = await staticPagesService.list(2, signal)

    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/pages',
      query: { page: 2 },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.paginate).toMatchObject({ current_page: 2, total_pages: 3, per_page: 15, total: 31 })
    expect(result.items[0]).toMatchObject({
      id: 2,
      slug: 'legacy Slug',
      title: { ar: 'سياسة الخصوصية', en: null },
      content: { ar: 'محتوى', en: null },
      isPublished: true,
      isSystem: false,
      createdAt: rawPage.created_at,
      updatedAt: rawPage.updated_at,
    })
  })

  it('GETs authoritative Show by id and normalizes the detail', async () => {
    const signal = new AbortController().signal
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: rawPage } })

    await expect(staticPagesService.show(2, signal)).resolves.toMatchObject({ id: 2, isPublished: true })
    expect(httpMocks.get).toHaveBeenCalledWith({
      url: '/dashboard/pages/2',
      signal,
      suppressErrorNotification: true,
    })
  })

  it('POSTs exact multipart Create fields with normalized slug and numeric boolean strings', async () => {
    httpMocks.post.mockResolvedValue({ data: { success: true, message: 'created', data: rawPage } })

    await staticPagesService.create(createPayload)

    const request = httpMocks.post.mock.calls[0][0]
    expect(request).toMatchObject({
      url: '/dashboard/pages',
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect([...request.data.entries()]).toEqual([
      ['slug', 'privacy-policy'],
      ['title[ar]', 'سياسة الخصوصية'],
      ['title[en]', 'Privacy Policy'],
      ['content[ar]', 'محتوى'],
      ['content[en]', 'Content'],
      ['is_published', '1'],
      ['is_system', '0'],
    ])
  })

  it('uses native multipart PUT with only a dirty localized branch and boolean', async () => {
    httpMocks.put.mockResolvedValue({ data: { success: true, message: 'updated', data: rawPage } })

    await staticPagesService.update(2, { title: { en: ' Updated ' }, isSystem: true })

    const request = httpMocks.put.mock.calls[0][0]
    expect(request).toMatchObject({
      url: '/dashboard/pages/2',
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect([...request.data.entries()]).toEqual([
      ['title[en]', 'Updated'],
      ['is_system', '1'],
    ])
    expect([...request.data.keys()]).not.toContain('_method')
    expect(httpMocks.post).not.toHaveBeenCalled()
  })

  it('omits an untouched legacy slug and normalizes a changed slug', () => {
    expect([...serializeStaticPageUpdate({ title: { ar: 'جديد' } }).entries()]).toEqual([['title[ar]', 'جديد']])
    expect([...serializeStaticPageUpdate({ slug: ' New / Page? ' }).entries()]).toEqual([['slug', 'new-page']])
  })
})
