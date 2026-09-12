import type { Banner } from '@/modules/banners/types/banner.types'

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
