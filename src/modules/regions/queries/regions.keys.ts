export const regionsKeys = {
  all: ['regions'] as const,
  lists: () => [...regionsKeys.all, 'list'] as const,
  list: () => [...regionsKeys.lists()] as const,
}
