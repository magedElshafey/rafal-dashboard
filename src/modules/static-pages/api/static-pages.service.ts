import type {
  PagesFilters,
  RawStaticPage,
  RawStaticPageResponse,
  RawStaticPageUpdateResponse,
  StaticPage,
  StaticPageCreatePayload,
  StaticPagesIndexResponse,
  StaticPageUpdatePayload,
} from '@/modules/static-pages/types/static-page.types'
import { emptyPagesFilters, serializePagesFilters } from '@/modules/static-pages/utils/static-page-filters'
import { normalizeStaticPageSlug } from '@/modules/static-pages/utils/static-page.utils'
import { $http } from '@/utils/http'

function normalizeId(value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('Static Page ID is unavailable')
  return value
}

function normalizeBoolean(value: boolean | 0 | 1): boolean {
  return value === true || value === 1
}

function requireNormalizedSlug(value: string): string {
  const slug = normalizeStaticPageSlug(value)
  if (!slug) throw new Error('Static Page slug is unavailable')
  return slug
}

function requireStaticPageSlug(value: string): string {
  if (!value.trim()) throw new Error('Static Page slug is unavailable')
  return value
}

export function normalizeStaticPage(raw: RawStaticPage): StaticPage {
  return {
    id: normalizeId(raw.id),
    slug: raw.slug,
    title: {
      ar: typeof raw.title.ar === 'string' ? raw.title.ar : null,
      en: typeof raw.title.en === 'string' ? raw.title.en : null,
    },
    content: {
      ar: typeof raw.content.ar === 'string' ? raw.content.ar : null,
      en: typeof raw.content.en === 'string' ? raw.content.en : null,
    },
    isPublished: normalizeBoolean(raw.is_published),
    isSystem: normalizeBoolean(raw.is_system),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function serializeStaticPageCreate(payload: StaticPageCreatePayload): FormData {
  const body = new FormData()
  body.set('slug', requireNormalizedSlug(payload.slug))
  body.set('title[ar]', payload.title.ar.trim())
  body.set('title[en]', payload.title.en.trim())
  body.set('content[ar]', payload.content.ar.trim())
  body.set('content[en]', payload.content.en.trim())
  body.set('is_published', payload.isPublished ? '1' : '0')
  return body
}

export function serializeStaticPageUpdate(payload: StaticPageUpdatePayload): FormData {
  const body = new FormData()
  body.set('slug', requireStaticPageSlug(payload.slug))
  body.set('title[ar]', payload.title.ar.trim())
  body.set('title[en]', payload.title.en.trim())
  body.set('content[ar]', payload.content.ar.trim())
  body.set('content[en]', payload.content.en.trim())
  body.set('is_published', payload.isPublished ? '1' : '0')
  return body
}

export const staticPagesService = {
  async list(
    page: number,
    signal?: AbortSignal,
    filters: PagesFilters = emptyPagesFilters
  ): Promise<PaginatedData<StaticPage>> {
    const response = (
      await $http.get<StaticPagesIndexResponse>({
        url: '/dashboard/pages',
        query: { ...serializePagesFilters(filters), page },
        signal,
        suppressErrorNotification: true,
      })
    ).data
    const items = response.data.map(normalizeStaticPage)
    return {
      items,
      paginate: {
        current_page: response.meta.current_page,
        total_pages: response.meta.last_page,
        per_page: response.meta.per_page,
        total: response.meta.total,
        count: items.length,
        next_page_url:
          response.meta.current_page < response.meta.last_page ? String(response.meta.current_page + 1) : null,
        prev_page_url: response.meta.current_page > 1 ? String(response.meta.current_page - 1) : null,
      },
      extra: null,
    }
  },

  async show(id: number, signal?: AbortSignal): Promise<StaticPage> {
    const response = await $http.get<RawStaticPageResponse>({
      url: `/dashboard/pages/${id}`,
      signal,
      suppressErrorNotification: true,
    })
    return normalizeStaticPage(response.data.data)
  },

  async create(payload: StaticPageCreatePayload): Promise<StaticPage> {
    const response = await $http.post<RawStaticPageResponse>({
      url: '/dashboard/pages',
      data: serializeStaticPageCreate(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeStaticPage(response.data.data)
  },

  async update(id: number, payload: StaticPageUpdatePayload): Promise<StaticPage | null> {
    const response = await $http.put<RawStaticPageUpdateResponse>({
      url: `/dashboard/pages/${id}`,
      data: serializeStaticPageUpdate(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data.data ? normalizeStaticPage(response.data.data) : null
  },
}
