import type { Banner, BannerDestinationType } from '@/modules/banners/types/banner.types'

export type BannerScheduleState = 'inactive' | 'upcoming' | 'current' | 'ended' | 'unscheduled'

export function getBannerScheduleState(banner: Banner, now = new Date()): BannerScheduleState {
  if (!banner.is_active) return 'inactive'
  const timestamp = now.getTime()
  if (banner.starts_at && new Date(banner.starts_at).getTime() > timestamp) return 'upcoming'
  if (banner.ends_at && new Date(banner.ends_at).getTime() < timestamp) return 'ended'
  if (banner.starts_at || banner.ends_at) return 'current'
  return 'unscheduled'
}

export function toDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function normalizeBannerDestinationId(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value.trim()))) return Number.NaN
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : Number.NaN
}

export function getBannerDestinationType(banner: Pick<Banner, 'product_id' | 'category_id'>): BannerDestinationType | '' {
  if (Number.isSafeInteger(banner.product_id) && Number(banner.product_id) > 0 && banner.category_id === null) return 'product'
  if (Number.isSafeInteger(banner.category_id) && Number(banner.category_id) > 0 && banner.product_id === null) return 'category'
  return ''
}
