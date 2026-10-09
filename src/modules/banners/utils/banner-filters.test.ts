import { describe, expect, it } from 'vitest'
import { bannersKeys } from '../queries/banners.keys'
import {
  bannerPlatformValues,
  bannerSortDirections,
  bannerSortValues,
  emptyBannersFilters,
  readBannersFilters,
  serializeBannersFilters,
} from './banner-filters'

describe('Banners server query filters', () => {
  it.each(bannerPlatformValues)('serializes platform=%s', (platform) => {
    expect(serializeBannersFilters({ ...emptyBannersFilters, platform })).toEqual({ platform })
  })

  it('ignores unsupported platform and omits inactive filters', () => {
    expect(readBannersFilters({ platform: 'desktop', search: 'ignored', per_page: '50' })).toEqual(emptyBannersFilters)
    expect(serializeBannersFilters(emptyBannersFilters)).toEqual({})
  })

  it.each([
    ['isActive', 'is_active', true, 1],
    ['isActive', 'is_active', false, 0],
    ['activeNow', 'active_now', true, 1],
    ['activeNow', 'active_now', false, 0],
  ] as const)('preserves %s=%s', (property, parameter, value, serialized) => {
    expect(serializeBannersFilters({ ...emptyBannersFilters, [property]: value })).toEqual({
      [parameter]: serialized,
    })
  })

  it.each(bannerSortValues)('serializes supported sort_by=%s', (sortBy) => {
    expect(serializeBannersFilters({ ...emptyBannersFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(bannerSortDirections)('serializes supported sort_dir=%s', (sortDir) => {
    expect(serializeBannersFilters({ ...emptyBannersFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('ignores unsupported sorting and includes active filters in query identity', () => {
    expect(readBannersFilters({ sort_by: 'title', sort_dir: 'down' })).toEqual(emptyBannersFilters)
    expect(bannersKeys.list({ ...emptyBannersFilters, platform: 'web' })).not.toEqual(bannersKeys.list())
  })
})
