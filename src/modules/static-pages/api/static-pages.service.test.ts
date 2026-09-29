import { beforeEach, describe, expect, it, vi } from 'vitest'

const httpMocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))

import { serializeStaticPageUpdate, staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import type {
  RawStaticPage,
  StaticPageCreatePayload,
  StaticPageUpdatePayload,
} from '@/modules/static-pages/types/static-page.types'

const rawPage: RawStaticPage = {
  id: 2,
  slug: 'legacy Slug',
  title: { ar: 'سياسة الخصوصية' },
  content: { ar: '<p>محتوى</p>' },
  is_published: 1,
  is_system: false,
  created_at: '2026-09-28T13:31:50+00:00',
  updated_at: '2026-09-28T13:31:50+00:00',
}

const createPayload: StaticPageCreatePayload = {
  slug: ' Privacy / Policy? ',
  title: { ar: ' سياسة الخصوصية ', en: ' Privacy Policy ' },
  content: { ar: ' <p>محتوى</p> ', en: ' <p>Content</p> ' },
  isPublished: true,
}

const updatePayload: StaticPageUpdatePayload = {
  slug: 'Legacy Slug',
  title: { ar: 'سياسة الخصوصية', en: 'Updated Privacy Policy' },
  content: { ar: '<p>محتوى</p>', en: '<p>Content</p>' },
  isPublished: true,
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
      content: { ar: '<p>محتوى</p>', en: null },
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
      ['content[ar]', '<p>محتوى</p>'],
      ['content[en]', '<p>Content</p>'],
      ['is_published', '1'],
    ])
    expect([...request.data.keys()]).not.toContain('is_system')
  })

  it('uses native multipart PUT and always sends the complete writable body', async () => {
    httpMocks.put.mockResolvedValue({ data: { success: true, message: 'updated', data: rawPage } })

    await staticPagesService.update(2, updatePayload)

    const request = httpMocks.put.mock.calls[0][0]
    expect(request).toMatchObject({
      url: '/dashboard/pages/2',
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    expect([...request.data.entries()]).toEqual([
      ['slug', 'Legacy Slug'],
      ['title[ar]', 'سياسة الخصوصية'],
      ['title[en]', 'Updated Privacy Policy'],
      ['content[ar]', '<p>محتوى</p>'],
      ['content[en]', '<p>Content</p>'],
      ['is_published', '1'],
    ])
    expect([...request.data.keys()]).not.toContain('_method')
    expect([...request.data.keys()]).not.toContain('is_system')
    expect(httpMocks.post).not.toHaveBeenCalled()
  })

  it('preserves an authoritative legacy slug and accepts a normalized edited slug', () => {
    expect(serializeStaticPageUpdate(updatePayload).get('slug')).toBe('Legacy Slug')
    expect(serializeStaticPageUpdate({ ...updatePayload, slug: 'new-page' }).get('slug')).toBe('new-page')
  })

  it('supports a message-only Update response for exact Show reconciliation', async () => {
    httpMocks.put.mockResolvedValue({ data: { success: true, message: 'updated' } })

    await expect(staticPagesService.update(2, updatePayload)).resolves.toBeNull()
  })
})
