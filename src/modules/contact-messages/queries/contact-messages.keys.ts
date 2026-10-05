export const contactMessagesKeys = {
  all: ['contact-messages'] as const,
  lists: () => [...contactMessagesKeys.all, 'list'] as const,
  list: () => [...contactMessagesKeys.lists()] as const,
  details: () => [...contactMessagesKeys.all, 'detail'] as const,
  detail: (id: number) => [...contactMessagesKeys.details(), id] as const,
  mutation: (id: number) => [...contactMessagesKeys.all, 'mutation', id] as const,
}
