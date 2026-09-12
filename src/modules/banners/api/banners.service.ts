import env from '@/config/env'
import { bannersMockTransport } from '@/modules/banners/mocks/banners.mock'
import type {
  Banner,
  BannerPayload,
  BannerResponse,
  BannersIndexResponse,
  DeleteBannerResponse,
} from '@/modules/banners/types/banner.types'
import { $http } from '@/utils/http'

type RawBanner = Omit<Banner, 'sort_order'> & { sort_order: number | string }
type RawBannerResponse = Omit<BannerResponse, 'data'> & { data: RawBanner }
type RawBannersIndexResponse = Omit<BannersIndexResponse, 'data'> & { data: RawBanner[] }

export function normalizeBanner(banner: RawBanner): Banner {
  return { ...banner, sort_order: Number(banner.sort_order) }
}

function normalizeResponse(response: RawBannerResponse): BannerResponse {
  return { ...response, data: normalizeBanner(response.data) }
}

function appendOptional(body: FormData, key: string, value: string | null) {
  if (value) body.set(key, value)
}

export function serializeBanner(payload: BannerPayload) {
  const body = new FormData()
  body.set('placement', payload.placement)
  body.set('title[ar]', payload.title.ar)
  body.set('title[en]', payload.title.en)
  body.set('platform', payload.platform)
  body.set('is_active', payload.is_active ? '1' : '0')
  body.set('sort_order', String(payload.sort_order))
  appendOptional(body, 'link_url', payload.link_url)
  appendOptional(body, 'starts_at', payload.starts_at)
  appendOptional(body, 'ends_at', payload.ends_at)
  if (payload.image) body.set('image', payload.image)
  return body
}

const bannersHttpTransport = {
  async list(page: number, signal?: AbortSignal) {
    const response = await $http.get<RawBannersIndexResponse>({
      url: '/dashboard/banners',
      query: { page },
      signal,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async show(id: number, signal?: AbortSignal) {
    const response = await $http.get<RawBannerResponse>({
      url: `/dashboard/banners/${id}`,
      signal,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async create(payload: BannerPayload) {
    const response = await $http.post<RawBannerResponse>({
      url: '/dashboard/banners',
      data: serializeBanner(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async update(id: number, payload: BannerPayload) {
    const response = await $http.put<RawBannerResponse>({
      url: `/dashboard/banners/${id}`,
      data: serializeBanner(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
  async delete(id: number) {
    const response = await $http.delete<DeleteBannerResponse>({
      url: `/dashboard/banners/${id}`,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return response.data
  },
}

const transport = env.BANNERS_USE_MOCK ? bannersMockTransport : bannersHttpTransport

export const bannersService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<Banner>> {
    const response = (await transport.list(page, signal)) as RawBannersIndexResponse
    const items = response.data.map(normalizeBanner)
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
  async show(id: number, signal?: AbortSignal) {
    return normalizeResponse((await transport.show(id, signal)) as RawBannerResponse)
  },
  async create(payload: BannerPayload) {
    return normalizeResponse((await transport.create(payload)) as RawBannerResponse)
  },
  async update(id: number, payload: BannerPayload) {
    return normalizeResponse((await transport.update(id, payload)) as RawBannerResponse)
  },
  delete: (id: number) => transport.delete(id),
}
