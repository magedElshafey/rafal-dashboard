import type {
  Banner,
  BannerPayload,
  BannerResponse,
  BannersFilters,
  BannersIndexResponse,
  DeleteBannerResponse,
} from '@/modules/banners/types/banner.types'
import { emptyBannersFilters, serializeBannersFilters } from '@/modules/banners/utils/banner-filters'
import { $http } from '@/utils/http'

import { bannerPositions } from '../types/banner.types'
import { normalizeBannerDestinationId } from '../utils/banner.utils'

type RawBanner = Omit<Banner, 'sort_order' | 'product_id' | 'category_id' | 'position'> & {
  sort_order: number | string
  product_id?: number | string | null
  category_id?: number | string | null
  position?: string | null
}
type RawBannerResponse = Omit<BannerResponse, 'data'> & { data: RawBanner }
type RawBannersIndexResponse = Omit<BannersIndexResponse, 'data'> & { data: RawBanner[] }

export function normalizeBanner(banner: RawBanner): Banner {
  return {
    ...banner,
    sort_order: Number(banner.sort_order),
    product_id: normalizeBannerDestinationId(banner.product_id),
    category_id: normalizeBannerDestinationId(banner.category_id),
    position: bannerPositions.find(position => position === banner.position) ?? null,
  }
}

function normalizeResponse(response: RawBannerResponse): BannerResponse {
  return { ...response, data: normalizeBanner(response.data) }
}

function appendOptional(body: FormData, key: string, value: string | null) {
  if (value) body.set(key, value)
}

export function serializeBanner(payload: BannerPayload) {
  const product = normalizeBannerDestinationId(payload.product_id)
  const category = normalizeBannerDestinationId(payload.category_id)
  if (!bannerPositions.includes(payload.position) ||
    !((product !== null && Number.isSafeInteger(product) && category === null) ||
      (category !== null && Number.isSafeInteger(category) && product === null))) {
    throw new Error('Invalid banner destination or position')
  }
  const body = new FormData()
  body.set('position', payload.position)
  // Existing Laravel multipart convention: an empty field clears a nullable ID.
  body.set('product_id', product === null ? '' : String(product))
  body.set('category_id', category === null ? '' : String(category))
  body.set('placement', 'home')
  body.set('title[ar]', payload.title.ar)
  body.set('title[en]', payload.title.en)
  body.set('platform', payload.platform)
  body.set('is_active', payload.is_active ? '1' : '0')
  body.set('sort_order', String(payload.sort_order))
  appendOptional(body, 'starts_at', payload.starts_at)
  appendOptional(body, 'ends_at', payload.ends_at)
  if (payload.image) body.set('image', payload.image)
  return body
}

const bannersHttpTransport = {
  async list(page: number, signal?: AbortSignal, filters: BannersFilters = emptyBannersFilters) {
    const response = await $http.get<RawBannersIndexResponse>({
      url: '/dashboard/banners',
      query: { ...serializeBannersFilters(filters), page },
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

export const bannersService = {
  async list(
    page: number,
    signal?: AbortSignal,
    filters: BannersFilters = emptyBannersFilters
  ): Promise<PaginatedData<Banner>> {
    const response = await bannersHttpTransport.list(page, signal, filters)
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
    return normalizeResponse(await bannersHttpTransport.show(id, signal))
  },
  async create(payload: BannerPayload) {
    return normalizeResponse(await bannersHttpTransport.create(payload))
  },
  async update(id: number, payload: BannerPayload) {
    return normalizeResponse(await bannersHttpTransport.update(id, payload))
  },
  delete: (id: number) => bannersHttpTransport.delete(id),
}
