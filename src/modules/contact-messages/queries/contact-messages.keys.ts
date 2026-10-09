import type { ContactMessagesFilters } from '../types/contact-message.types'
import { emptyContactMessagesFilters } from '../utils/contact-message-filters'

export const contactMessagesKeys = {
  all: ['contact-messages'] as const,
  lists: () => [...contactMessagesKeys.all, 'list'] as const,
  list: (filters: ContactMessagesFilters = emptyContactMessagesFilters) =>
    [...contactMessagesKeys.lists(), filters] as const,
  details: () => [...contactMessagesKeys.all, 'detail'] as const,
  detail: (id: number) => [...contactMessagesKeys.details(), id] as const,
  mutation: (id: number) => [...contactMessagesKeys.all, 'mutation', id] as const,
}
