import { describe, expect, it } from 'vitest'

import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'
import {
  emptyPagesFilters,
  readPagesFilters,
  serializePagesFilters,
  staticPageSortDirections,
  staticPageSortValues,
} from '@/modules/static-pages/utils/static-page-filters'

describe('Static Pages server query filters', () => {
  it('trims and serializes search while omitting blank search', () => {
    expect(serializePagesFilters({ ...emptyPagesFilters, search: '  privacy  ' })).toEqual({ search: 'privacy' })
    expect(serializePagesFilters({ ...emptyPagesFilters, search: '   ' })).toEqual({})
  })

  it.each([
    [true, 1],
    [false, 0],
  ] as const)('serializes is_published=%s', (isPublished, expected) => {
    expect(serializePagesFilters({ ...emptyPagesFilters, isPublished })).toEqual({ is_published: expected })
  })

  it.each(staticPageSortValues)('serializes sort_by=%s', (sortBy) => {
    expect(serializePagesFilters({ ...emptyPagesFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(staticPageSortDirections)('serializes sort_dir=%s', (sortDir) => {
    expect(serializePagesFilters({ ...emptyPagesFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('ignores unsupported and inactive values and never introduces per_page', () => {
    expect(readPagesFilters({ is_published: '', sort_by: 'title', sort_dir: 'down', per_page: '50' })).toEqual(
      emptyPagesFilters
    )
    expect(serializePagesFilters(emptyPagesFilters)).toEqual({})
    expect(serializePagesFilters(emptyPagesFilters)).not.toHaveProperty('per_page')
  })

  it('includes search and filters in query identity', () => {
    expect(staticPagesKeys.list({ ...emptyPagesFilters, search: 'privacy' })).not.toEqual(staticPagesKeys.list())
    expect(staticPagesKeys.list({ ...emptyPagesFilters, isPublished: false })).not.toEqual(staticPagesKeys.list())
  })
})
