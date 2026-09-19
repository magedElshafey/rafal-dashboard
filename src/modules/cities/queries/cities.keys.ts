export const citiesKeys = {
  all: ['cities'] as const,
  lists: () => [...citiesKeys.all, 'list'] as const,
  list: () => [...citiesKeys.lists()] as const,
}
