import { toApiBoolean } from '@/utils/api/serialize-api-boolean'
import type { BannerPlatform, BannersFilters, BannerSortBy, BannerSortDir } from '../types/banner.types'

export const bannerPlatformValues: BannerPlatform[] = ['web', 'mobile', 'both']
export const bannerSortValues: BannerSortBy[] = ['sort_order', 'created_at', 'starts_at']
export const bannerSortDirections: BannerSortDir[] = ['asc', 'desc']
export const bannerFilterNames = ['platform', 'is_active', 'active_now', 'sort_by', 'sort_dir']

export const emptyBannersFilters: BannersFilters = {
  platform: null,
  isActive: null,
  activeNow: null,
  sortBy: null,
  sortDir: null,
}

export function readBannersFilters(query: Record<string, string> | null): BannersFilters {
  const platform = query?.platform as BannerPlatform | undefined
  const sortBy = query?.sort_by as BannerSortBy | undefined
  const sortDir = query?.sort_dir as BannerSortDir | undefined
  return {
    platform: platform && bannerPlatformValues.includes(platform) ? platform : null,
    isActive: query?.is_active === '1' ? true : query?.is_active === '0' ? false : null,
    activeNow: query?.active_now === '1' ? true : query?.active_now === '0' ? false : null,
    sortBy: sortBy && bannerSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && bannerSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function serializeBannersFilters(filters: BannersFilters) {
  return {
    ...(filters.platform ? { platform: filters.platform } : {}),
    ...(filters.isActive !== null ? { is_active: toApiBoolean(filters.isActive) } : {}),
    ...(filters.activeNow !== null ? { active_now: toApiBoolean(filters.activeNow) } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
