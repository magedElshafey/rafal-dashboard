import { describe, expect, it } from 'vitest'
import { contactMessagesKeys } from '../queries/contact-messages.keys'
import {
  contactMessageSortDirections,
  contactMessageSortValues,
  emptyContactMessagesFilters,
  readContactMessagesFilters,
  serializeContactMessagesFilters,
  validContactMessagesCreatedRange,
} from './contact-message-filters'

describe('Contact Messages server query filters', () => {
  it('serializes created_from and created_to and omits empty dates', () => {
    expect(
      serializeContactMessagesFilters({
        ...emptyContactMessagesFilters,
        createdFrom: '2026-10-01',
        createdTo: '2026-10-09',
      })
    ).toEqual({ created_from: '2026-10-01', created_to: '2026-10-09' })
    expect(serializeContactMessagesFilters(emptyContactMessagesFilters)).toEqual({})
  })

  it('rejects invalid date ranges', () => {
    const filters = { ...emptyContactMessagesFilters, createdFrom: '2026-10-10', createdTo: '2026-10-09' }
    expect(validContactMessagesCreatedRange(filters)).toBe(false)
    expect(() => serializeContactMessagesFilters(filters)).toThrow('Invalid contact message created date range')
  })

  it.each(contactMessageSortValues)('serializes supported sort_by=%s', (sortBy) => {
    expect(serializeContactMessagesFilters({ ...emptyContactMessagesFilters, sortBy })).toEqual({ sort_by: sortBy })
  })

  it.each(contactMessageSortDirections)('serializes supported sort_dir=%s', (sortDir) => {
    expect(serializeContactMessagesFilters({ ...emptyContactMessagesFilters, sortDir })).toEqual({ sort_dir: sortDir })
  })

  it('ignores unsupported values and never forwards search or per_page', () => {
    expect(readContactMessagesFilters({ sort_by: 'id', sort_dir: 'down', search: 'ignored', per_page: '50' })).toEqual(
      emptyContactMessagesFilters
    )
    expect(serializeContactMessagesFilters(emptyContactMessagesFilters)).not.toHaveProperty('search')
    expect(serializeContactMessagesFilters(emptyContactMessagesFilters)).not.toHaveProperty('per_page')
  })

  it('includes every active filter in query identity', () => {
    const variants = [
      { createdFrom: '2026-10-01' },
      { createdTo: '2026-10-09' },
      { sortBy: 'status' as const },
      { sortDir: 'desc' as const },
    ]
    const keys = [
      contactMessagesKeys.list(),
      ...variants.map((variant) => contactMessagesKeys.list({ ...emptyContactMessagesFilters, ...variant })),
    ]
    expect(new Set(keys.map((key) => JSON.stringify(key))).size).toBe(keys.length)
  })
})
