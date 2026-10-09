import type {
  ContactMessagesFilters,
  ContactMessageSortBy,
  ContactMessageSortDir,
} from '../types/contact-message.types'

export const contactMessageSortValues: ContactMessageSortBy[] = ['created_at', 'status', 'name']
export const contactMessageSortDirections: ContactMessageSortDir[] = ['asc', 'desc']
export const contactMessageFilterNames = ['created_from', 'created_to', 'sort_by', 'sort_dir']

export const emptyContactMessagesFilters: ContactMessagesFilters = {
  createdFrom: '',
  createdTo: '',
  sortBy: null,
  sortDir: null,
}

const validDate = (value: string) => {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function readContactMessagesFilters(query: Record<string, string> | null): ContactMessagesFilters {
  const sortBy = query?.sort_by as ContactMessageSortBy | undefined
  const sortDir = query?.sort_dir as ContactMessageSortDir | undefined

  return {
    createdFrom: query?.created_from ?? '',
    createdTo: query?.created_to ?? '',
    sortBy: sortBy && contactMessageSortValues.includes(sortBy) ? sortBy : null,
    sortDir: sortDir && contactMessageSortDirections.includes(sortDir) ? sortDir : null,
  }
}

export function validContactMessagesCreatedRange(filters: Pick<ContactMessagesFilters, 'createdFrom' | 'createdTo'>) {
  return (
    validDate(filters.createdFrom) &&
    validDate(filters.createdTo) &&
    (!filters.createdFrom || !filters.createdTo || filters.createdFrom <= filters.createdTo)
  )
}

export function serializeContactMessagesFilters(filters: ContactMessagesFilters) {
  if (!validContactMessagesCreatedRange(filters)) throw new Error('Invalid contact message created date range')

  return {
    ...(filters.createdFrom ? { created_from: filters.createdFrom } : {}),
    ...(filters.createdTo ? { created_to: filters.createdTo } : {}),
    ...(filters.sortBy ? { sort_by: filters.sortBy } : {}),
    ...(filters.sortDir ? { sort_dir: filters.sortDir } : {}),
  }
}
