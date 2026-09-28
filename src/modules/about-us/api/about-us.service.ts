import type {
  AboutUs,
  AboutUsUpdatePayload,
  RawAboutUs,
  RawAboutUsResponse,
} from '@/modules/about-us/types/about-us.types'
import type { LocalizedName } from '@/types/localized-name.types'
import { $http } from '@/utils/http'

function normalizeMediaUrl(value: string | null): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizeLocalized(value: LocalizedName): LocalizedName {
  if (typeof value?.ar !== 'string' || typeof value?.en !== 'string') {
    throw new Error('About Us data is unavailable')
  }
  return { ar: value.ar, en: value.en }
}

export function normalizeAboutUs(raw: RawAboutUs): AboutUs {
  if (!raw || typeof raw !== 'object' || !Number.isFinite(raw.id) || !Array.isArray(raw.features)) {
    throw new Error('About Us data is unavailable')
  }
  return {
    id: raw.id,
    heroTitle: normalizeLocalized(raw.hero_title),
    heroSubtitle: normalizeLocalized(raw.hero_subtitle),
    heroImageUrl: normalizeMediaUrl(raw.hero_image_url),
    story: normalizeLocalized(raw.story),
    vision: normalizeLocalized(raw.vision),
    mission: normalizeLocalized(raw.mission),
    features: raw.features.map((feature) => {
      if (typeof feature.key !== 'string' || !feature.key) throw new Error('About Us data is unavailable')
      return {
        key: feature.key,
        title: normalizeLocalized(feature.title),
        subtitle: normalizeLocalized(feature.subtitle),
        iconUrl: normalizeMediaUrl(feature.icon_url),
      }
    }),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function appendLocalized(body: FormData, key: string, value: Partial<LocalizedName>) {
  if (value.ar !== undefined) body.set(`${key}[ar]`, value.ar.trim())
  if (value.en !== undefined) body.set(`${key}[en]`, value.en.trim())
}

export function serializeAboutUsUpdate(payload: AboutUsUpdatePayload): FormData {
  const body = new FormData()
  body.set('_method', 'PUT')
  if (payload.heroTitle) appendLocalized(body, 'hero_title', payload.heroTitle)
  if (payload.heroSubtitle) appendLocalized(body, 'hero_subtitle', payload.heroSubtitle)
  if (payload.story) appendLocalized(body, 'story', payload.story)
  if (payload.vision) appendLocalized(body, 'vision', payload.vision)
  if (payload.mission) appendLocalized(body, 'mission', payload.mission)
  if (payload.hero) body.set('hero', payload.hero)
  payload.features?.forEach((feature, index) => {
    const prefix = `features[${index}]`
    if (feature.key !== undefined) body.set(`${prefix}[key]`, feature.key)
    body.set(`${prefix}[title][ar]`, feature.title.ar.trim())
    body.set(`${prefix}[title][en]`, feature.title.en.trim())
    body.set(`${prefix}[subtitle][ar]`, feature.subtitle.ar.trim())
    body.set(`${prefix}[subtitle][en]`, feature.subtitle.en.trim())
    if (feature.icon) body.set(`${prefix}[icon]`, feature.icon)
  })
  return body
}

function normalizeResponse(response: RawAboutUsResponse): AboutUs {
  if (!response.data) throw new Error('About Us data is unavailable')
  return normalizeAboutUs(response.data)
}

export const aboutUsService = {
  async get(signal?: AbortSignal): Promise<AboutUs> {
    const response = await $http.get<RawAboutUsResponse>({
      url: '/dashboard/about-us',
      signal,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data)
  },
  async update(payload: AboutUsUpdatePayload): Promise<AboutUs> {
    const response = await $http.post<RawAboutUsResponse>({
      url: '/dashboard/about-us',
      data: serializeAboutUsUpdate(payload),
      isFormData: true,
      suppressSuccessNotification: true,
      suppressErrorNotification: true,
    })
    return normalizeResponse(response.data)
  },
}
