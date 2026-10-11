import type { QueryClient } from '@tanstack/react-query'
import { contactMessagesKeys } from '../queries/contact-messages.keys'
import type { ContactMessage } from '../types/contact-message.types'

/** Age alone is not uncertainty. Explicit invalidation or an unfinished/failed Show is. */
export function hasTrustworthyContactMessage(client: QueryClient, id: number) {
  const state = client.getQueryState<ContactMessage>(contactMessagesKeys.detail(id))
  if (!state) return false
  return state.fetchStatus === 'idle' && state.status === 'success' && !state.isInvalidated && state.data?.id === id
}
