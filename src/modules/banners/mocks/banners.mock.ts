import type {
  Banner,
  BannerPayload,
  BannerResponse,
  BannersIndexResponse,
  DeleteBannerResponse,
} from '@/modules/banners/types/banner.types'

const INITIAL_BANNERS: Banner[] = [
  {
    id: 42,
    placement: 'home',
    title: { ar: 'مجموعة جديدة وصلت', en: 'New collection arrived' },
    link_url: '/products/new-collection',
    platform: 'both',
    starts_at: null,
    ends_at: null,
    is_active: true,
    sort_order: 4,
    image_url: 'https://picsum.photos/seed/rafal-banner-42/960/540',
    created_at: '2026-09-06T20:01:03+00:00',
    updated_at: '2026-09-06T20:01:03+00:00',
  },
  {
    id: 43,
    placement: 'splash',
    title: { ar: 'عروض الخريف', en: 'Autumn offers' },
    link_url: null,
    platform: 'mobile',
    starts_at: '2026-09-20T08:00:00+00:00',
    ends_at: '2026-10-20T20:00:00+00:00',
    is_active: true,
    sort_order: 1,
    image_url: 'https://picsum.photos/seed/rafal-banner-43/960/540',
    created_at: '2026-09-06T20:01:03+00:00',
    updated_at: '2026-09-06T20:01:03+00:00',
  },
  {
    id: 44,
    placement: 'home',
    title: { ar: 'اختيارات رفال', en: 'Rafal picks' },
    link_url: '/products/featured',
    platform: 'web',
    starts_at: null,
    ends_at: null,
    is_active: false,
    sort_order: 2,
    image_url: 'https://picsum.photos/seed/rafal-banner-44/960/540',
    created_at: '2026-09-06T20:01:03+00:00',
    updated_at: '2026-09-06T20:01:03+00:00',
  },
  {
    id: 45,
    placement: 'home',
    title: { ar: 'وصل حديثًا', en: 'Just arrived' },
    link_url: '/products/latest',
    platform: 'both',
    starts_at: null,
    ends_at: null,
    is_active: true,
    sort_order: 3,
    image_url: 'https://picsum.photos/seed/rafal-banner-45/960/540',
    created_at: '2026-09-06T20:01:03+00:00',
    updated_at: '2026-09-06T20:01:03+00:00',
  },
  {
    id: 46,
    placement: 'splash',
    title: { ar: 'تسوق عبر التطبيق', en: 'Shop in the app' },
    link_url: null,
    platform: 'mobile',
    starts_at: null,
    ends_at: null,
    is_active: true,
    sort_order: 5,
    image_url: 'https://picsum.photos/seed/rafal-banner-46/960/540',
    created_at: '2026-09-06T20:01:03+00:00',
    updated_at: '2026-09-06T20:01:03+00:00',
  },
  {
    id: 47,
    placement: 'home',
    title: { ar: 'تخفيضات مختارة', en: 'Selected discounts' },
    link_url: '/products/sale',
    platform: 'web',
    starts_at: null,
    ends_at: null,
    is_active: true,
    sort_order: 6,
    image_url: 'https://picsum.photos/seed/rafal-banner-47/960/540',
    created_at: '2026-09-06T20:01:03+00:00',
    updated_at: '2026-09-06T20:01:03+00:00',
  },
]

let banners = INITIAL_BANNERS.map(cloneBanner)
let nextId = 48
const PAGE_SIZE = 15
const LATENCY = 180

function cloneBanner(banner: Banner): Banner {
  return { ...banner, title: { ...banner.title } }
}

function wait() {
  return new Promise<void>((resolve) => setTimeout(resolve, LATENCY))
}

function now() {
  return new Date().toISOString()
}

export function resetBannersMock() {
  banners = INITIAL_BANNERS.map(cloneBanner)
  nextId = 48
}

export function seedBannersMock(nextBanners: Banner[]) {
  banners = nextBanners.map(cloneBanner)
  nextId = Math.max(0, ...banners.map((banner) => banner.id)) + 1
}

export const bannersMockTransport = {
  async list(page: number): Promise<BannersIndexResponse> {
    await wait()
    const start = (page - 1) * PAGE_SIZE
    const data = banners.slice(start, start + PAGE_SIZE).map(cloneBanner)
    return {
      success: true,
      message: 'Banners retrieved successfully',
      data,
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil(banners.length / PAGE_SIZE)),
        per_page: PAGE_SIZE,
        total: banners.length,
      },
    }
  },
  async show(id: number): Promise<BannerResponse> {
    await wait()
    const banner = banners.find((item) => item.id === id)
    if (!banner) throw new Error('Banner not found')
    return { success: true, message: 'Banner retrieved successfully', data: cloneBanner(banner) }
  },
  async create(payload: BannerPayload): Promise<BannerResponse> {
    await wait()
    const timestamp = now()
    const id = nextId++
    const banner: Banner = {
      ...payload,
      id,
      title: { ...payload.title },
      image_url: `https://picsum.photos/seed/rafal-banner-${id}/960/540`,
      created_at: timestamp,
      updated_at: timestamp,
    }
    delete (banner as Banner & { image?: File }).image
    banners.unshift(banner)
    return { success: true, message: 'Banner created successfully', data: cloneBanner(banner) }
  },
  async update(id: number, payload: BannerPayload): Promise<BannerResponse> {
    await wait()
    const index = banners.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Banner not found')
    const current = banners[index]
    const next: Banner = {
      ...current,
      ...payload,
      title: { ...payload.title },
      image_url: payload.image
        ? `https://picsum.photos/seed/rafal-banner-${id}-${payload.image.lastModified}/960/540`
        : current.image_url,
      updated_at: now(),
    }
    delete (next as Banner & { image?: File }).image
    banners[index] = next
    return { success: true, message: 'Banner updated successfully', data: cloneBanner(next) }
  },
  async delete(id: number): Promise<DeleteBannerResponse> {
    await wait()
    banners = banners.filter((banner) => banner.id !== id)
    return { success: true, message: 'Banner deleted successfully' }
  },
}
